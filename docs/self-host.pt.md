# Self-host (Docker Compose)

Self-host de referência do núcleo aberto. Requisitos: **Node.js ≥ 20** e
**Docker**.

## Subir

```bash
npm install
npm run compose:up    # Postgres + API + Agents (migrations + seed automáticos)
# API     → http://localhost:4000
# OpenAPI → http://localhost:4000/docs
```

O contêiner da API executa, na subida, `migrate` → `seed` (idempotente) →
servidor. Sobem três serviços: `postgres`, `api`, `agents`.

## Sem Docker (dev)

```bash
npm install
# suba um Postgres e provisione o role de app (RLS):
#   psql ... -f infra/postgres/init/02-app-role.sql
npm run migration:run --workspace @vantar/api
npm run dev:api
```

## Variáveis de ambiente principais

| Variável | Default (dev) | Para quê |
|---|---|---|
| `DATABASE_URL` | `postgres://vantar:vantar@postgres:5432/vantar` | migrate/seed (superuser; ignora RLS) |
| `APP_DATABASE_URL` | role `vantar_app` | runtime (não-superuser; sujeito ao RLS) |
| `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` | par efêmero (aviso) | assinatura RS256 — **definir em produção** |
| `CORS_ORIGINS` | `http://localhost:3000` | allowlist de origens |
| `AGENTS_URL` | `http://agents:8000` | endpoint do AI Agent Plane |
| `AUTH_LOCKOUT_THRESHOLD` / `_BASE_MINUTES` / `_MAX_MINUTES` | 5 / 15 / 60 | account lockout (SEC-03) |
| `AI_USE_LLM` | `true` | liga a chamada ao LLM (senão, heurística) |
| `OLLAMA_URL` / `OLLAMA_MODEL` | `http://ollama:11434` / `llama3.1` | provider LLM self-host |
| `EGRESS_ALLOWLIST` | — | hosts extra liberados no guard de egress (IMDS sempre bloqueado) |

> O LLM é **opcional**: sem Ollama, a revisão por IA cai na **heurística STRIDE**
> (rotulada como tal). Ver [IA](ai.md).

## Produção (recomendações)

- Definir `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY` persistentes (não efêmeros).
- TLS/Ingress à frente da API; `CORS_ORIGINS` restrito.
- Backups do Postgres + teste de restore; migrations revisadas (forward-only).
- Verificar a **assinatura cosign** e a **proveniência SLSA** das imagens.
