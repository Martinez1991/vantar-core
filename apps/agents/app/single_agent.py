"""Single-agent Security Design Review (open core).

The open core ships a **single agent** with a **basic prompt**: one LLM call
that produces the whole review, with a deterministic heuristic fallback. The
multi-agent orchestration (LangGraph) with complex, specialized prompts is part
of Vantar Enterprise.

Honest by design: if no LLM is available (or it fails), it falls back to the
STRIDE catalog heuristic — it never fakes AI generation.
"""
from __future__ import annotations

import json
from typing import Any

from . import llm
from .catalog import (
    ELEMENT_TYPE_LABEL,
    STRIDE_BY_TYPE,
    STRIDE_MITIGATION,
    STRIDE_REQUIREMENT,
)
from .schemas import (
    DesignReview,
    Dfd,
    DfdFlow,
    DfdNode,
    Provenance,
    RequirementOut,
    ReviewRequest,
    ReviewResult,
    RiskOut,
    ThreatOut,
)
from .security import sanitize_inputs

AGENT = "SecurityArchitectAgent"

# Basic keyword → element hints (intentionally simpler than the EE multi-agent).
_DATASTORE_HINTS = {
    "Database": ["postgres", "mysql", "database", "banco de dados", "rds", " sql"],
    "Cache": ["redis", "cache", "memcached"],
    "Object Storage": ["s3", "bucket", "object storage", "blob"],
}
_IMPACT_BY_CATEGORY = {
    "Elevation of Privilege": 5,
    "Information Disclosure": 4,
    "Tampering": 4,
    "Denial of Service": 3,
    "Spoofing": 3,
    "Repudiation": 2,
}
_RISK_CATEGORIES = {"Elevation of Privilege", "Information Disclosure", "Tampering"}

# Basic single prompt (the EE edition uses specialized multi-step prompts).
_SYSTEM = (
    "You are a security architect performing a Security Design Review. "
    "Given an architecture description (and optional OpenAPI/Terraform/Kubernetes), "
    "produce a STRIDE-based threat model. Output ONLY valid JSON, no prose."
)
_PROMPT = """Analyze the system below and return JSON with this exact shape:
{{
  "dfd": {{"nodes": [{{"type": "external|process|datastore|boundary", "name": "..."}}],
           "flows": [{{"from": "name", "to": "name", "name": "...", "protocol": "..."}}]}},
  "threats": [{{"element": "name", "category": "<STRIDE>", "title": "...",
                "description": "...", "mitigation": "..."}}],
  "risks": [{{"title": "...", "likelihood": 1-5, "impact": 1-5, "category": "..."}}],
  "requirements": [{{"code": "...", "title": "...", "framework": "ASVS", "control": "..."}}],
  "design_review": {{"overview": "...", "trust_boundaries": ["..."], "data_flows": ["..."]}}
}}
STRIDE categories: Spoofing, Tampering, Repudiation, Information Disclosure,
Denial of Service, Elevation of Privilege.

System:
{context}
"""


async def run_single_agent(req: ReviewRequest) -> ReviewResult:
    clean, warnings = sanitize_inputs(
        {
            "description": req.description,
            "openapi": req.openapi,
            "terraform": req.terraform,
            "k8s": req.k8s,
        }
    )

    if req.use_llm and await llm.is_available():
        result = await _llm_review(clean, warnings)
        if result is not None:
            return result
        warnings.append("LLM indisponível/sem resposta válida; usando heurística.")

    return _heuristic_review(clean, warnings)


async def _llm_review(clean: dict[str, str], warnings: list[str]) -> ReviewResult | None:
    context = "\n\n".join(f"## {k}\n{v}" for k, v in clean.items() if v).strip()
    data = await llm.generate_json(_SYSTEM, _PROMPT.format(context=context or "(no input)"))
    if not isinstance(data, dict):
        return None
    try:
        dfd = _coerce_dfd(data.get("dfd") or {})
        threats = [ThreatOut(**t) for t in (data.get("threats") or []) if _ok_threat(t)]
        risks = [RiskOut(**r) for r in (data.get("risks") or []) if _ok_risk(r)]
        reqs = [RequirementOut(**q) for q in (data.get("requirements") or []) if _ok_req(q)]
        dr = data.get("design_review") or {}
        review = DesignReview(
            overview=str(dr.get("overview") or "Security design review."),
            trust_boundaries=list(dr.get("trust_boundaries") or []),
            data_flows=list(dr.get("data_flows") or []),
        )
    except Exception:
        return None
    if not threats:  # an empty model is not a useful AI result
        return None
    return ReviewResult(
        engine=llm.engine_label(),
        dfd=dfd,
        threats=threats,
        risks=risks,
        requirements=reqs,
        design_review=review,
        warnings=warnings,
        provenance=[Provenance(agent=AGENT, engine=llm.engine_label(), note="single-agent, basic prompt")],
    )


def _heuristic_review(clean: dict[str, str], warnings: list[str]) -> ReviewResult:
    text = " ".join(v for v in clean.values() if v).lower()

    # --- Basic DFD ---
    nodes = [DfdNode(type="external", name="User / Client"), DfdNode(type="process", name="Application / API")]
    flows = [DfdFlow(from_="User / Client", to="Application / API", name="Request", protocol="HTTPS")]
    for name, hints in _DATASTORE_HINTS.items():
        if any(h in text for h in hints):
            nodes.append(DfdNode(type="datastore", name=name))
            flows.append(DfdFlow(from_="Application / API", to=name, name="Read/Write", protocol="internal"))
    dfd = Dfd(nodes=nodes, flows=flows)

    # --- STRIDE threats per element ---
    threats: list[ThreatOut] = []
    categories: set[str] = set()
    for node in nodes:
        label = ELEMENT_TYPE_LABEL.get(node.type, node.type)
        for cat in STRIDE_BY_TYPE.get(node.type, []):
            categories.add(cat)
            threats.append(
                ThreatOut(
                    element=f"{node.name} ({label})",
                    category=cat,  # type: ignore[arg-type]
                    title=f"{cat} on {node.name}",
                    mitigation=STRIDE_MITIGATION.get(cat),
                )
            )

    # --- Basic risks (high-impact categories only) ---
    risks = [
        RiskOut(title=f"{cat} exposure", likelihood=3, impact=_IMPACT_BY_CATEGORY.get(cat, 3), category=f"STRIDE: {cat}")
        for cat in sorted(categories & _RISK_CATEGORIES)
    ]

    # --- Requirements from STRIDE→ASVS mapping ---
    reqs = [
        RequirementOut(**STRIDE_REQUIREMENT[cat])
        for cat in STRIDE_REQUIREMENT
        if cat in categories
    ]

    review = DesignReview(
        overview=(
            "Basic Security Design Review (open core, single agent). "
            f"{len(nodes)} element(s), {len(threats)} STRIDE threat(s). "
            "For multi-agent depth and richer prompts, see Vantar Enterprise."
        ),
        trust_boundaries=["Client ↔ Application"],
        data_flows=[f.name for f in flows],
    )

    return ReviewResult(
        engine="heuristic",
        dfd=dfd,
        threats=threats,
        risks=risks,
        requirements=reqs,
        design_review=review,
        warnings=warnings,
        provenance=[Provenance(agent=AGENT, engine="heuristic", note="single-agent, STRIDE catalog")],
    )


# ---- validation helpers for LLM output ----

def _coerce_dfd(raw: dict[str, Any]) -> Dfd:
    nodes = [DfdNode(type=n["type"], name=n["name"]) for n in (raw.get("nodes") or []) if n.get("name") and n.get("type")]
    flows = []
    for f in raw.get("flows") or []:
        src = f.get("from") or f.get("from_")
        if src and f.get("to") and f.get("name"):
            flows.append(DfdFlow(from_=src, to=f["to"], name=f["name"], protocol=f.get("protocol")))
    return Dfd(nodes=nodes, flows=flows)


def _ok_threat(t: Any) -> bool:
    return isinstance(t, dict) and t.get("element") and t.get("category") and t.get("title")


def _ok_risk(r: Any) -> bool:
    try:
        return isinstance(r, dict) and r.get("title") and 1 <= int(r.get("likelihood", 0)) <= 5 and 1 <= int(r.get("impact", 0)) <= 5
    except (TypeError, ValueError):
        return False


def _ok_req(q: Any) -> bool:
    return isinstance(q, dict) and all(q.get(k) for k in ("code", "title", "framework", "control"))
