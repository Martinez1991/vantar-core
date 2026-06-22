"""Tests for the single-agent LLM path (mocked LLM — no network)."""
import asyncio

import app.llm as llm
import app.single_agent as sa
from app.schemas import ReviewRequest

VALID = {
    "dfd": {"nodes": [{"type": "process", "name": "API"}], "flows": []},
    "threats": [
        {"element": "API", "category": "Spoofing", "title": "Spoof API", "mitigation": "MFA"}
    ],
    "risks": [{"title": "Spoof", "likelihood": 3, "impact": 3, "category": "STRIDE: Spoofing"}],
    "requirements": [{"code": "REQ-AUTH", "title": "Auth", "framework": "ASVS", "control": "V2"}],
    "design_review": {"overview": "ok", "trust_boundaries": [], "data_flows": []},
}


def test_llm_path_used_when_available(monkeypatch):
    async def _avail():
        return True

    async def _gen(_s, _p):
        return VALID

    monkeypatch.setattr(llm, "is_available", _avail)
    monkeypatch.setattr(llm, "generate_json", _gen)
    res = asyncio.run(sa.run_single_agent(ReviewRequest(description="x", use_llm=True)))
    assert res.engine == llm.engine_label()
    assert res.threats[0].category == "Spoofing"
    assert res.provenance[0].note.startswith("single-agent")


def test_empty_llm_result_falls_back_to_heuristic(monkeypatch):
    async def _avail():
        return True

    async def _gen(_s, _p):
        return None

    monkeypatch.setattr(llm, "is_available", _avail)
    monkeypatch.setattr(llm, "generate_json", _gen)
    res = asyncio.run(sa.run_single_agent(ReviewRequest(description="API with redis", use_llm=True)))
    assert res.engine == "heuristic"
    assert any("heurística" in w for w in res.warnings)


def test_malformed_llm_dict_rejected(monkeypatch):
    async def _avail():
        return True

    async def _gen(_s, _p):
        return {"threats": "not-a-list"}  # invalid → fallback

    monkeypatch.setattr(llm, "is_available", _avail)
    monkeypatch.setattr(llm, "generate_json", _gen)
    res = asyncio.run(sa.run_single_agent(ReviewRequest(description="app", use_llm=True)))
    assert res.engine == "heuristic"
