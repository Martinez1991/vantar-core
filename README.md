<div align="center">

# Security Design Review Framework

**The open core of Vantar — Security Design Review, Threat Modeling and Risk Analysis.**

`Apache-2.0` · headless (API) · **Complementary** to OWASP ThreatAtlas

> 🌐 **English** · [Português](README.pt-BR.md)

</div>

---

> ### ⚠️ Affiliation notice
>
> `vantar-core` is **not yet an OWASP project**. "OWASP" is a registered trademark
> of the OWASP Foundation, and the name/logo may only be used after a project is
> formally accepted. Until then this work is an **independent community draft**. The
> OWASP branding in this repository is intentionally withheld and will be enabled
> only upon acceptance into the **OWASP Incubator**. See
> [`docs/00-introduction.md`](docs/00-introduction.md).

---

## What it is

An open, **vendor-neutral** framework for **Security Design Review** at the
design stage (*Shift-Left Security*). It delivers the content and the API; it
**does not compete** with OWASP ThreatAtlas — it **integrates** with it
(push/pull), which remains the collaborative system-of-record for threat
modeling.

### Open content

- **Architecture questionnaires** + maturity scoring
- **Risk analysis framework** (likelihood × impact, residual, acceptance)
- **ASVS requirements library**
- **Threat Modeling** (STRIDE generator/curator + **ThreatAtlas integration**)
- **AI Security Design Review** — a **single agent** with a **basic prompt**
  (one LLM call + STRIDE heuristic fallback). The multi-agent orchestration
  (LangGraph) with complex prompts is **Enterprise**.
- **Security Review templates** + per-project report
- **Public REST API** (OpenAPI at `/docs`)
- **Reference self-host** (Docker Compose), multi-tenant with Postgres RLS

> The **Enterprise** offering (managed SaaS, **multi-agent** AppSec AI,
> GitHub/GitLab/Jira/Confluence integrations, SSO/SCIM, executive reports, support) is commercial
> and lives in a separate repository. This framework works **without** it.

## Getting started

Requirements: Node.js ≥ 20, Docker.

```bash
npm install
npm run compose:up            # Postgres + API (migrations + seed automatic)
# API → http://localhost:4000  ·  OpenAPI → http://localhost:4000/docs
```

Without Docker (dev):

```bash
npm install
# start a Postgres and provision the app role:
#   psql ... -f infra/postgres/init/02-app-role.sql
npm run migration:run --workspace @vantar/api
npm run dev:api
```

## Architecture

| Plane | Stack |
|---|---|
| **Business Plane** | NestJS + TypeScript |
| **AI Agent Plane** | Python / FastAPI — single agent, basic prompt (Ollama optional) |
| **Data** | PostgreSQL (multi-tenant RLS), TypeORM migrations |
| **AuthN/Z** | JWT RS256 + refresh (rotation) + TOTP MFA · RBAC |
| **System-of-record** | OWASP ThreatAtlas (push/pull integration) |

## Community

- [`CONTRIBUTING.md`](CONTRIBUTING.md) · [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) · [`SECURITY.md`](SECURITY.md)
- Enterprise platform: https://github.com/Martinez1991/vantar-enterprise
- Website: https://github.com/Martinez1991/vantar-site

`Apache-2.0` — see [`LICENSE`](LICENSE).
