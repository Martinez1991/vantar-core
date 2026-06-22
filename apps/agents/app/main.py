"""Vantar Architect — AI Agent Plane (open core, single agent).

Exposes the automated Security Design Review consumed by the Business Plane
(NestJS). Publishing to a project goes through human-in-the-loop.

Open core = a SINGLE agent with a BASIC prompt (one LLM call + heuristic
fallback). The multi-agent orchestration (LangGraph) with complex prompts is
part of Vantar Enterprise.
"""
from __future__ import annotations

import os

from fastapi import FastAPI

from . import llm
from .schemas import ReviewRequest, ReviewResult
from .single_agent import run_single_agent

app = FastAPI(
    title="Vantar Architect — AI Agent Plane (open core)",
    version="0.1.0",
    description="Single-agent Security Design Review (basic prompt).",
)


@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "service": "vantar-architect",
        "orchestrator": "single-agent",
        "edition": "open-core",
        "llm": {
            "enabled": llm.LLM_ENABLED,
            "model": llm.OLLAMA_MODEL,
            "available": await llm.is_available(),
        },
    }


@app.get("/agents")
async def agents_info() -> dict:
    return {"agents": ["SecurityArchitectAgent"], "orchestrator": "single-agent", "edition": "open-core"}


@app.post("/reviews", response_model=ReviewResult, response_model_by_alias=True)
async def create_review(req: ReviewRequest) -> ReviewResult:
    """Run the single-agent review and return the structured design review."""
    return await run_single_agent(req)


if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
