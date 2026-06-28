"""Testes do guard de egress / anti-SSRF (SEC-02)."""
import asyncio

import pytest

from app import llm
from app.egress import SsrfError, assert_url_allowed


def test_rejeita_esquema_nao_http():
    with pytest.raises(SsrfError):
        assert_url_allowed("ftp://example.com/x")
    with pytest.raises(SsrfError):
        assert_url_allowed("file:///etc/passwd")


def test_bloqueia_imds_sempre():
    # Endpoint de metadados da nuvem — bloqueado mesmo via IP literal.
    with pytest.raises(SsrfError):
        assert_url_allowed("http://169.254.169.254/latest/meta-data/")


def test_bloqueia_imds_mesmo_allowlistado(monkeypatch):
    monkeypatch.setenv("EGRESS_ALLOWLIST", "169.254.169.254")
    with pytest.raises(SsrfError):
        assert_url_allowed("http://169.254.169.254/latest/meta-data/")


def test_bloqueia_faixa_privada_e_loopback():
    with pytest.raises(SsrfError):
        assert_url_allowed("http://10.0.0.5:8080/")
    with pytest.raises(SsrfError):
        assert_url_allowed("http://127.0.0.1:11434/")


def test_allowlist_libera_faixa_privada(monkeypatch):
    # Um IP privado explicitamente allowlistado passa (ex.: host interno do Ollama).
    monkeypatch.setenv("EGRESS_ALLOWLIST", "10.0.0.5")
    assert_url_allowed("http://10.0.0.5:11434/api/tags")  # não levanta


def test_ip_publico_passa():
    assert_url_allowed("https://8.8.8.8/")  # global, não-privado → ok


def test_llm_degrada_quando_destino_bloqueado(monkeypatch):
    # Ollama apontado para o IMDS → is_available False e geração None (sem exceção).
    monkeypatch.setattr(llm, "LLM_ENABLED", True)
    monkeypatch.setattr(llm, "OLLAMA_URL", "http://169.254.169.254")
    assert asyncio.run(llm.is_available()) is False
    assert asyncio.run(llm.generate_json("s", "p")) is None
