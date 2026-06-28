"""Guard de egress / anti-SSRF para o AI Agent Plane (RS-LLM-006, SEC-02).

Contexto honesto: o AI plane **não** busca URLs fornecidas pelo usuário — as
entradas (OpenAPI/Terraform/k8s) chegam como *texto*, nunca como links a serem
baixados. A única saída de rede é para o Ollama (`OLLAMA_URL`). Ainda assim,
aplicamos defesa em profundidade: toda chamada HTTP de saída passa por
`assert_url_allowed`, que:

- aceita apenas `http`/`https`;
- **bloqueia o endpoint de metadados da nuvem (IMDS, 169.254.169.254) sempre**,
  inclusive para hosts allowlistados — metadados de cloud nunca são destino
  legítimo;
- bloqueia destinos em faixas privadas/loopback/link-local/reservadas, exceto
  hosts na allowlist (o host do Ollama entra automaticamente, pois resolve para
  um IP interno do cluster/compose). Allowlist extra via `EGRESS_ALLOWLIST`.
"""
from __future__ import annotations

import ipaddress
import os
import socket
from urllib.parse import urlparse

# Metadados de nuvem — nunca um destino de saída legítimo (AWS/GCP/Azure/OCI).
_IMDS_IPS = {
    ipaddress.ip_address("169.254.169.254"),
    ipaddress.ip_address("fd00:ec2::254"),
}


class SsrfError(ValueError):
    """Destino de saída bloqueado pela política de egress (anti-SSRF)."""


def _allowlist() -> set[str]:
    """Hosts confiáveis para saída (lidos do ambiente a cada chamada)."""
    hosts: set[str] = set()
    ollama = urlparse(os.getenv("OLLAMA_URL", "http://ollama:11434"))
    if ollama.hostname:
        hosts.add(ollama.hostname.lower())
    for raw in os.getenv("EGRESS_ALLOWLIST", "").split(","):
        host = raw.strip().lower()
        if host:
            hosts.add(host)
    return hosts


def _resolve_ips(host: str, port: int | None):
    try:
        infos = socket.getaddrinfo(host, port or 0, proto=socket.IPPROTO_TCP)
    except socket.gaierror as exc:  # host não resolve → bloqueia (fail-closed)
        raise SsrfError(f"host não resolvível: {host}") from exc
    ips = []
    for info in infos:
        raw = info[4][0].split("%")[0]  # descarta zone-id de IPv6 link-local
        ips.append(ipaddress.ip_address(raw))
    return ips


def assert_url_allowed(url: str) -> None:
    """Levanta `SsrfError` se a URL violar a política de egress."""
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise SsrfError(f"esquema não permitido: {parsed.scheme!r}")
    host = (parsed.hostname or "").lower()
    if not host:
        raise SsrfError("URL sem host")

    ips = _resolve_ips(host, parsed.port)

    # IMDS é bloqueado SEMPRE, mesmo para hosts allowlistados.
    if any(ip in _IMDS_IPS for ip in ips):
        raise SsrfError("acesso a metadados da nuvem (IMDS) bloqueado")

    if host in _allowlist():
        return  # destino interno confiável (ex.: Ollama)

    for ip in ips:
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_multicast
            or ip.is_unspecified
        ):
            raise SsrfError(f"destino em faixa não roteável/privada bloqueado: {ip}")
