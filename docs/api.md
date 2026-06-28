# API REST (núcleo aberto)

API headless versionada sob `/api`. **Autenticação Bearer JWT**; o tenant é
derivado do token. O contrato autoritativo é o **OpenAPI** publicado pela própria
API em **`/docs`** (Swagger UI).

## Autenticação

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Cria tenant + usuário owner; emite sessão |
| POST | `/api/auth/login` | Login (com MFA quando ativo); **account lockout** após N falhas |
| POST | `/api/auth/refresh` | Rotação de refresh token |
| POST | `/api/auth/logout` | Revoga o refresh token |
| GET | `/api/auth/me` | Perfil do usuário autenticado |
| POST | `/api/auth/mfa/setup` · `/enable` · `/disable` | MFA TOTP |

Resposta de login retorna `{ accessToken, refreshToken, user }` ou
`{ mfaRequired: true }`. Conta bloqueada responde **401** com mensagem de bloqueio
temporário (ver [Segurança](security.md)).

## Recursos de negócio

Famílias de recursos do Security Design Review (todas escopadas por tenant via
RLS; papéis via RBAC):

- **`/api/projects`** — portfólio de projetos/sistemas em avaliação.
- **Questionários** — questionários de maturidade/arquitetura.
- **Riscos** — framework de risco (probabilidade × impacto, nível, residual).
- **Requisitos** — biblioteca ASVS e requisitos por projeto.
- **Threat modeling** — geração/curadoria STRIDE + sync ThreatAtlas.
- **Reports** — relatórios de Security Design Review.
- **`/api/analytics`**, **`/api/audit`** — postura/maturidade e trilha de auditoria.
- **`/api/ai`** — dispara a revisão de segurança por IA (single-agent) e consulta o resultado.

## Operacional

- **`/health`** — liveness/readiness (fora do prefixo `/api`).
- **`/metrics`** — métricas Prometheus.

## Erros

Padrão HTTP: `400` validação, `401` não autenticado / credenciais inválidas /
conta bloqueada, `403` sem permissão (RBAC), `404` inexistente, `409` conflito,
`422` semântico. Mensagens não vazam dados de outro tenant nem segredos.

> Para o esquema completo (parâmetros, corpos, exemplos), use o **OpenAPI em
> `/docs`** da instância em execução.
