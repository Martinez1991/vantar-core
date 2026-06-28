"""Provider de LLM — Ollama (self-host CE) com degradação graciosa.

Honesto por design: se o Ollama não estiver acessível ou sem o modelo, as
chamadas retornam None e o orquestrador cai no caminho heurístico. Nada de
fingir geração por IA. Bedrock/Azure (RF-AI-008) entram como providers futuros.
"""
from __future__ import annotations

import json
import os
from typing import Any, Optional

import httpx

from .egress import assert_url_allowed

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")
LLM_ENABLED = os.getenv("AI_USE_LLM", "true").lower() == "true"
TIMEOUT = float(os.getenv("AI_LLM_TIMEOUT", "60"))


def engine_label() -> str:
    return f"ollama:{OLLAMA_MODEL}"


async def is_available() -> bool:
    """Verifica se o Ollama responde e tem o modelo configurado."""
    if not LLM_ENABLED:
        return False
    try:  # pragma: no cover - network IO (needs a live Ollama)
        assert_url_allowed(f"{OLLAMA_URL}/api/tags")  # SEC-02: anti-SSRF/egress
        async with httpx.AsyncClient(timeout=5) as client:
            res = await client.get(f"{OLLAMA_URL}/api/tags")
            if res.status_code != 200:
                return False
            models = [m.get("name", "") for m in res.json().get("models", [])]
            return any(m.split(":")[0] == OLLAMA_MODEL.split(":")[0] for m in models)
    except Exception:
        return False


async def generate_json(system: str, prompt: str) -> Optional[dict[str, Any]]:
    """Pede ao LLM uma resposta JSON. Retorna dict ou None em qualquer falha."""
    if not LLM_ENABLED:
        return None
    try:  # pragma: no cover - network IO (needs a live Ollama)
        assert_url_allowed(f"{OLLAMA_URL}/api/generate")  # SEC-02: anti-SSRF/egress
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            res = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "system": system,
                    "prompt": prompt,
                    "format": "json",
                    "stream": False,
                    "options": {"temperature": 0.2},
                },
            )
            if res.status_code != 200:
                return None
            text = res.json().get("response", "")
            return json.loads(text)
    except Exception:
        return None
