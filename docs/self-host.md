# Self-host (Docker Compose)

Reference self-host of the open core. Requirements: **Node.js ≥ 20** and **Docker**.

## Start

```bash
npm install
npm run compose:up    # Postgres + API + Agents (migrations + seed automatic)
# API     → http://localhost:4000
# OpenAPI → http://localhost:4000/docs
```

On startup the API container runs `migrate` → `seed` (idempotent) → server. Three
services come up: `postgres`, `api`, `agents`.

## Without Docker (dev)

```bash
npm install
# start a Postgres and provision the app role (RLS):
#   psql ... -f infra/postgres/init/02-app-role.sql
npm run migration:run --workspace @vantar/api
npm run dev:api
```

## Main environment variables

| Variable | Default (dev) | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgres://vantar:vantar@postgres:5432/vantar` | migrate/seed (superuser; bypasses RLS) |
| `APP_DATABASE_URL` | role `vantar_app` | runtime (non-superuser; subject to RLS) |
| `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` | ephemeral pair (warns) | RS256 signing — **set in production** |
| `CORS_ORIGINS` | `http://localhost:3000` | origins allowlist |
| `AGENTS_URL` | `http://agents:8000` | AI Agent Plane endpoint |
| `AUTH_LOCKOUT_THRESHOLD` / `_BASE_MINUTES` / `_MAX_MINUTES` | 5 / 15 / 60 | account lockout (SEC-03) |
| `AI_USE_LLM` | `true` | enable the LLM call (otherwise heuristic) |
| `OLLAMA_URL` / `OLLAMA_MODEL` | `http://ollama:11434` / `llama3.1` | self-host LLM provider |
| `EGRESS_ALLOWLIST` | — | extra hosts allowed by the egress guard (IMDS always blocked) |

> The LLM is **optional**: with no Ollama, AI review falls back to the **STRIDE
> heuristic** (labeled as such). See [AI](ai.md).

## Production (recommendations)

- Set persistent `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY` (not ephemeral).
- TLS/Ingress in front of the API; restricted `CORS_ORIGINS`.
- Postgres backups + restore test; reviewed migrations (forward-only).
- Verify the images' **cosign signature** and **SLSA provenance**.
