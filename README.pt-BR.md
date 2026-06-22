> [English](README.md) · 🌐 **Português**

<div align="center">

# OWASP Security Design Review Framework

**Núcleo aberto do Vantar — Security Design Review, Threat Modeling e Risk Analysis.**

`Apache-2.0` · headless (API) · **Complementar** ao OWASP ThreatAtlas

</div>

---

## O que é

Framework aberto e **vendor-neutral** para **Security Design Review** na fase de
concepção (*Shift-Left Security*). Entrega o conteúdo e a API; **não concorre**
com o OWASP ThreatAtlas — **integra-se** a ele (push/pull), que permanece o
system-of-record colaborativo de threat modeling.

### Conteúdo aberto

- **Questionários de arquitetura** + scoring de maturidade
- **Framework de análise de risco** (P×I, residual, aceite)
- **Biblioteca de requisitos ASVS**
- **Threat Modeling** (gerador/curador STRIDE + **integração ThreatAtlas**)
- **Security Design Review por IA** — um **único agente** com **prompt básico**
  (1 chamada de LLM + fallback heurístico STRIDE). O multi-agent (LangGraph) com
  prompts complexos é **Enterprise**.
- **Templates de Security Review** + relatório por projeto
- **API REST pública** (OpenAPI em `/docs`)
- **Self-host de referência** (Docker Compose), multi-tenant com Postgres RLS

> A oferta **Enterprise** (SaaS gerenciado, IA AppSec **multi-agent**, integrações
> GitHub/GitLab/Jira/Confluence, SSO/SCIM, relatórios executivos, suporte) é
> comercial e vive em repositório separado. Este framework funciona **sem** ela.

## Começando

Pré-requisitos: Node.js ≥ 20, Docker.

```bash
npm install
npm run compose:up            # Postgres + API (migrations + seed automáticos)
# API → http://localhost:4000  ·  OpenAPI → http://localhost:4000/docs
```

Sem Docker (dev):

```bash
npm install
# suba um Postgres e provisione o role do app:
#   psql ... -f infra/postgres/init/02-app-role.sql
npm run migration:run --workspace @vantar/api
npm run dev:api
```

## Arquitetura

| Plano | Stack |
|---|---|
| **Business Plane** | NestJS + TypeScript |
| **AI Agent Plane** | Python / FastAPI — agente único, prompt básico (Ollama opcional) |
| **Data** | PostgreSQL (RLS multi-tenant), migrations TypeORM |
| **AuthN/Z** | JWT RS256 + refresh (rotação) + MFA TOTP · RBAC |
| **System-of-record** | OWASP ThreatAtlas (integração push/pull) |

## Comunidade

- [`CONTRIBUTING.md`](CONTRIBUTING.pt-BR.md) · [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.pt-BR.md) · [`SECURITY.md`](SECURITY.pt-BR.md)
- Plataforma Enterprise: https://github.com/Martinez1991/vantar-enterprise
- Site: https://github.com/Martinez1991/vantar-site

`Apache-2.0` — veja [`LICENSE`](LICENSE).
