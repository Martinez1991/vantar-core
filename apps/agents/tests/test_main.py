"""Smoke tests for the FastAPI app (single-agent, heuristic path)."""
from fastapi.testclient import TestClient

import app.llm as llm
from app.main import app


def test_endpoints(monkeypatch):
    async def _no_llm():
        return False

    monkeypatch.setattr(llm, "is_available", _no_llm)
    client = TestClient(app)

    health = client.get("/health").json()
    assert health["orchestrator"] == "single-agent"
    assert health["edition"] == "open-core"

    agents = client.get("/agents").json()
    assert agents["agents"] == ["SecurityArchitectAgent"]

    res = client.post("/reviews", json={"description": "API with PostgreSQL", "use_llm": False})
    assert res.status_code == 200
    body = res.json()
    assert body["engine"] == "heuristic"
    assert len(body["threats"]) > 0
    # alias serialization: flows use "from"
    if body["dfd"]["flows"]:
        assert "from" in body["dfd"]["flows"][0]
