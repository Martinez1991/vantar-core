# Contributing

> 🌐 **English** · [Português](CONTRIBUTING.pt-BR.md)

Thank you for your interest! The **OWASP Security Design Review Framework**
(Vantar's open core) welcomes community contributions under the
[Apache-2.0](LICENSE) license. By participating, you agree to the
[Code of Conduct](CODE_OF_CONDUCT.md).

## Before you start

- Check the open [issues](../../issues).
- For large changes, open an issue/discussion first to align on scope.
- **Do not reimplement OWASP ThreatAtlas.** The open threat modeling is a
  generator/curator and **integrates** with ThreatAtlas (the system-of-record).

## Environment

Requirements: Node.js ≥ 20, Docker.

```bash
npm install
npm run compose:up          # Postgres + API
npm run dev:api
```

## Standards

- **Commits**: [Conventional Commits](https://www.conventionalcommits.org)
  (`feat:`, `fix:`, `docs:`, `test:`, `chore:`…).
- **Tests**: every behavior change ships with tests. Run before the PR:
  ```bash
  npm run test --workspace @vantar/api
  npm run test:e2e --workspace @vantar/api   # needs Postgres + the vantar_app role
  ```
- **Coverage**: CI gates the core (services/guards/helpers); do not lower thresholds.
- **Engineering honesty**: no mocks that fake success; explicit degradation when
  an external dependency is not configured.

## DCO (Developer Certificate of Origin)

Sign your commits with `-s` (certifies you have the right to contribute the code):

```bash
git commit -s -m "feat: ..."
```

## Pull Requests

1. Fork and branch from `main`.
2. Ensure build, lint and tests are green locally.
3. Open the PR describing the problem, the solution and how you verified it.
4. One PR per feature; keep the diff focused.

## Security

Vulnerabilities do **not** go to public issues — see [`SECURITY.md`](SECURITY.md).
