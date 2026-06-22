"""Guardrails de entrada para o AI Agent Plane.

- Sanitização anti prompt-injection: entradas (IaC/OpenAPI/docs) são *untrusted
  input* (RS-LLM-001). Neutralizamos padrões de injeção antes de enviar ao LLM.
- Redaction de PII/segredos antes do LLM (RS-LLM-002): nada sensível trafega.
"""
from __future__ import annotations

import re

# Padrões comuns de prompt-injection (neutralizados, não removidos do contexto).
_INJECTION_PATTERNS = [
    r"ignore (all|any|the)? ?(previous|above|prior) (instructions|prompts?)",
    r"disregard (the )?(above|previous|system)",
    r"you are now\b",
    r"act as\b",
    r"system\s*:",
    r"</?(system|assistant|user)>",
    r"reveal (your|the) (system )?prompt",
    r"developer mode",
]

# Redaction de dados sensíveis (PII/segredos).
_REDACTIONS = [
    ("EMAIL", re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")),
    ("CPF", re.compile(r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b")),
    ("CARD", re.compile(r"\b(?:\d[ -]?){13,16}\b")),
    ("AWS_KEY", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("JWT", re.compile(r"\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b")),
    ("SECRET", re.compile(r"(?i)(api[_-]?key|secret|token|password|passwd)\s*[:=]\s*['\"]?[^\s'\"]{6,}")),
    ("PRIVATE_KEY", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")),
]

_INJECTION_RE = re.compile("|".join(_INJECTION_PATTERNS), re.IGNORECASE)


def sanitize(text: str) -> tuple[str, list[str]]:
    """Neutraliza prompt-injection e redige PII/segredos. Retorna (texto, avisos)."""
    if not text:
        return "", []
    warnings: list[str] = []

    injections = len(_INJECTION_RE.findall(text))
    if injections:
        text = _INJECTION_RE.sub("[conteúdo neutralizado]", text)
        warnings.append(
            f"{injections} padrão(ões) de prompt-injection neutralizado(s) na entrada (RS-LLM-001)."
        )

    for label, pattern in _REDACTIONS:
        new_text, n = pattern.subn(f"[REDACTED:{label}]", text)
        if n:
            text = new_text
            warnings.append(f"{n} ocorrência(s) de {label} redigida(s) antes do LLM (RS-LLM-002).")

    return text, warnings


def sanitize_inputs(parts: dict[str, str | None]) -> tuple[dict[str, str], list[str]]:
    """Sanitiza um dicionário de entradas (description/openapi/terraform/k8s)."""
    clean: dict[str, str] = {}
    warnings: list[str] = []
    for key, value in parts.items():
        if not value:
            clean[key] = ""
            continue
        cleaned, warns = sanitize(value)
        clean[key] = cleaned
        warnings.extend(f"[{key}] {w}" for w in warns)
    return clean, warnings
