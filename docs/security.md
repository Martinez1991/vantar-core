# Security (open core)

Vantar dogfoods its own domain: it follows OWASP ASVS/STRIDE and secure-design
practices. This page covers the **open-core** controls.

## Identity & access

- **JWT RS256** with **refresh token** rotation (SHA-256 hash; rotated on each use).
- **TOTP MFA** (otplib), optional per user.
- **RBAC**: `owner` / `admin` / `appsec` / `developer` / `viewer`.
- **Account lockout / anti brute-force** (SEC-03): after **5** consecutive
  failures the account is locked for an **exponential** window (15→60min); a
  success resets the counter; MFA failures count too. Configurable via env
  (`AUTH_LOCKOUT_THRESHOLD` / `_BASE_MINUTES` / `_MAX_MINUTES`).
- Passwords with **bcrypt**; secrets never returned in responses or logs.

## Tenant isolation (RLS)

Defense in depth: queries scoped by `tenantId` **and** forced Row-Level Security in
the database (non-superuser role `vantar_app` + `tenant_isolation` policy via
`app.current_tenant`). A tenant cannot see another tenant's data even with a
mis-scoped query.

## AI guardrails

- **Anti prompt-injection sanitization**: injection patterns are neutralized in the
  inputs (IaC/OpenAPI/description) before the LLM (RS-LLM-001).
- **PII/secret redaction** before the LLM (email, CPF, card, AWS keys, JWT, private
  keys…): nothing sensitive travels to the model (RS-LLM-002).
- **Egress / anti-SSRF** (SEC-02): every outbound HTTP call from the AI plane goes
  through a guard that allows http/https only, **always blocks IMDS**
  (169.254.169.254) and rejects private/loopback ranges unless allowlisted (the
  Ollama host is trusted). See [AI](ai.md) and the OWASP LLM Top 10.

## Headers & transport

**Helmet** (CSP/security headers), **CORS** allowlist (env), global validation and
sanitization (`class-validator`, whitelist + `forbidNonWhitelisted`).

## Cryptography primitives (for Enterprise)

`common/` exposes reusable open primitives:

- **`secret-cipher`** — symmetric **AES-256-GCM** cipher (versioned `enc:v1:`
  format), ready as a TypeORM column transformer and **KMS-ready**. The open core
  has no integration secrets to encrypt; the Enterprise edition wires this
  primitive onto Jira/SCM/Confluence tokens and the OIDC client secret (SEC-01).
- **`ssrf-guard`** — `assertPublicHttpUrl` (resolves the host and rejects
  private/IMDS), used by Enterprise for the server-side fetch of the OIDC issuer.

## Supply chain

Images signed with **cosign** (keyless) + **SLSA provenance** on release.
SCA/SAST/secret-scan in CI are recommended (dogfooding the Security Gate itself).

## Threat modeling

The `threat-modeling` module generates/curates **STRIDE** and synchronizes with
**OWASP ThreatAtlas** (the collaborative system-of-record) via API Tokens.
