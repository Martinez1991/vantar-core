# Security Policy

> 🌐 **English** · [Português](SECURITY.pt-BR.md)

## Reporting a vulnerability

Please do **not** open public issues for security vulnerabilities.

Use **GitHub Private Vulnerability Reporting** (the *Security* tab →
*Report a vulnerability*) or email **security@vantar.dev**.

When possible, include:

- description and impact;
- steps to reproduce (PoC);
- affected version/commit;
- suggested mitigation.

We will triage and respond as soon as possible. We ask for **coordinated
disclosure**: give us a reasonable window to fix before going public. We credit
reporters publicly (if desired).

## Scope

- The open core (OWASP Security Design Review Framework) and the reference
  implementation in this repository.
- Practices already in place: multi-tenant RLS, JWT RS256 + refresh with
  rotation, TOTP MFA, rate limiting, security headers, immutable audit trail.

## Supported versions

While the project is in early development (`0.x`), only the latest
`main`/release receives security fixes.
