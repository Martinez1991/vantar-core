# REST API (open core)

A headless API versioned under `/api`. **Bearer JWT authentication**; the tenant is
derived from the token. The authoritative contract is the **OpenAPI** published by
the API itself at **`/docs`** (Swagger UI).

## Authentication

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create tenant + owner user; issue a session |
| POST | `/api/auth/login` | Login (with MFA when enabled); **account lockout** after N failures |
| POST | `/api/auth/refresh` | Refresh token rotation |
| POST | `/api/auth/logout` | Revoke the refresh token |
| GET | `/api/auth/me` | Authenticated user profile |
| POST | `/api/auth/mfa/setup` · `/enable` · `/disable` | TOTP MFA |

Login returns `{ accessToken, refreshToken, user }` or `{ mfaRequired: true }`. A
locked account responds **401** with a temporary-lockout message (see
[Security](security.md)).

## Business resources

Security Design Review resource families (all tenant-scoped via RLS; roles via
RBAC):

- **`/api/projects`** — portfolio of projects/systems under review.
- **Questionnaires** — maturity/architecture questionnaires.
- **Risks** — risk framework (likelihood × impact, level, residual).
- **Requirements** — ASVS library and per-project requirements.
- **Threat modeling** — STRIDE generation/curation + ThreatAtlas sync.
- **Reports** — Security Design Review reports.
- **`/api/analytics`**, **`/api/audit`** — posture/maturity and the audit trail.
- **`/api/ai`** — trigger the AI (single-agent) security review and read the result.

## Operational

- **`/health`** — liveness/readiness (outside the `/api` prefix).
- **`/metrics`** — Prometheus metrics.

## Errors

Standard HTTP: `400` validation, `401` unauthenticated / invalid credentials /
locked account, `403` forbidden (RBAC), `404` not found, `409` conflict, `422`
semantic. Messages never leak other tenants' data or secrets.

> For the full schema (parameters, bodies, examples), use the running instance's
> **OpenAPI at `/docs`**.
