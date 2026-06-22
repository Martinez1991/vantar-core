"""Schemas de entrada/saída do Security Design Review (guardrail RS-LLM-004).

Toda saída de agente é validada contra estes modelos antes de retornar.
"""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

ElementType = Literal["external", "process", "datastore", "boundary"]
Stride = Literal[
    "Spoofing",
    "Tampering",
    "Repudiation",
    "Information Disclosure",
    "Denial of Service",
    "Elevation of Privilege",
]


class ReviewRequest(BaseModel):
    description: str = Field(default="", max_length=20000)
    openapi: Optional[str] = Field(default=None, max_length=200000)
    terraform: Optional[str] = Field(default=None, max_length=200000)
    k8s: Optional[str] = Field(default=None, max_length=200000)
    use_llm: bool = True


class DfdNode(BaseModel):
    type: ElementType
    name: str


class DfdFlow(BaseModel):
    from_: str = Field(alias="from")
    to: str
    name: str
    protocol: Optional[str] = None

    model_config = {"populate_by_name": True}


class Dfd(BaseModel):
    nodes: list[DfdNode] = []
    flows: list[DfdFlow] = []


class ThreatOut(BaseModel):
    element: str
    category: Stride
    title: str
    description: Optional[str] = None
    mitigation: Optional[str] = None


class RiskOut(BaseModel):
    title: str
    likelihood: int = Field(ge=1, le=5)
    impact: int = Field(ge=1, le=5)
    category: str


class RequirementOut(BaseModel):
    code: str
    title: str
    framework: str
    control: str


class DesignReview(BaseModel):
    overview: str
    trust_boundaries: list[str] = []
    data_flows: list[str] = []


class Provenance(BaseModel):
    agent: str
    engine: str
    note: str


class ReviewResult(BaseModel):
    engine: str
    dfd: Dfd
    threats: list[ThreatOut]
    risks: list[RiskOut]
    requirements: list[RequirementOut]
    design_review: DesignReview
    warnings: list[str] = []
    provenance: list[Provenance] = []
