# Vantar Core — Security Design Review Framework

> The **open core** (Apache-2.0) of Vantar: a headless **Security Design Review**
> platform — architecture questionnaires, a risk framework, an ASVS requirements
> library, threat modeling (STRIDE) and a **single AI agent** for security review.
> Complementary to [OWASP ThreatAtlas](https://owasp.org/) — it integrates, it
> does not reimplement.

!!! warning "Affiliation notice"
    `vantar-core` is **not yet an OWASP project**. "OWASP" is a registered
    trademark of the OWASP Foundation, and the name/logo may only be used after a
    project is formally accepted. Until then this is an **independent community
    draft**. OWASP branding is intentionally withheld and will be enabled only
    upon acceptance into the OWASP Incubator. See
    [Introduction](00-introduction.md).

## What it is (and isn't)

Vantar is **Open Core**. This documentation covers **only the open core**
(`vantar-core`). Commercial features live in the Enterprise edition and are **not**
detailed here.

| Open (this repository) | Enterprise (not covered here) |
|---|---|
| Headless REST API (NestJS), multi-tenant with RLS | **Multi-agent** AI + managed operation (SaaS) |
| Maturity/architecture questionnaires | Jira/SCM/Confluence integrations (PR gate) |
| Risk framework (likelihood × impact) | SSO/OIDC/SAML + SCIM |
| ASVS requirements library | Billing/subscriptions |
| Threat Modeling (STRIDE generator/curator) + ThreatAtlas integration | Managed ThreatAtlas parity |
| **Single-agent AI** (1 LLM call + STRIDE heuristic fallback) | — |
| Public REST API (OpenAPI) | — |
| Reference self-host (Docker Compose) | — |

## How to read

| Document | Covers |
|---|---|
| [Introduction](00-introduction.md) | Project status, OWASP affiliation & trademark, scope |
| [Architecture](architecture.md) | Style, multi-tenancy (RLS), AI plane, self-host topology |
| [Security](security.md) | AuthN/MFA/lockout, RLS, AI guardrails, egress/anti-SSRF, supply chain |
| [AI](ai.md) | Single-agent design review, guardrails, OWASP LLM Top 10, honest fallback |
| [API](api.md) | REST resources, authentication, contracts, OpenAPI |
| [Self-host](self-host.md) | Run locally with Docker Compose, env, migrations |

## Stack

**NestJS 10 + TypeORM 0.3 + PostgreSQL/pgvector** (headless Business Plane),
**FastAPI** (AI Agent Plane, single-agent, called over HTTP), **Ollama** (self-host
LLM, optional). Reference self-host via Docker Compose (`postgres` + `api` +
`agents`), with no dependency on a proprietary cloud service.

## Complementarity principle (OWASP ThreatAtlas)

The OSS **generates the content** (DFDs, STRIDE threats, mitigations, scores) and
**synchronizes** with ThreatAtlas via API Tokens (push/pull). It does not recreate
ThreatAtlas's visual editor, versioning or collaborative base — it integrates with
it.
