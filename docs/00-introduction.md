# Introduction & project status

## ⚠️ Affiliation notice

**`vantar-core` is not yet an OWASP project.** "OWASP" is a registered trademark of
the OWASP Foundation, and the name/logo may only be used after a project is
formally accepted. Until then this work is an **independent community draft**. The
OWASP branding in this repository is intentionally withheld and will be enabled
only upon acceptance into the **OWASP Incubator**.

What this means in practice:

- This repository does **not** use the OWASP name as a claim of membership, nor the
  OWASP logo. References to OWASP describe an **aspiration** (to be submitted to the
  OWASP Incubator) and **complementarity** with the existing OWASP ThreatAtlas
  project — never an existing affiliation.
- The project methodology aligns with OWASP standards (ASVS, STRIDE), but alignment
  is not endorsement.
- If and when the project is accepted into the OWASP Incubator, the branding will
  be enabled and this notice updated accordingly.

## What this project is

An open, **vendor-neutral** framework for **Security Design Review** at the design
stage (*Shift-Left Security*). It delivers the content and the API; it **does not
compete** with OWASP ThreatAtlas — it **integrates** with it (push/pull), which
remains the collaborative system-of-record for threat modeling.

Open content:

- **Architecture questionnaires** + maturity scoring
- **Risk analysis framework** (likelihood × impact, residual, acceptance)
- **ASVS requirements library**
- **Threat Modeling** (STRIDE generator/curator + **ThreatAtlas integration**)
- **AI Security Design Review** — a **single agent** with a **basic prompt** (one
  LLM call + STRIDE heuristic fallback)
- **Security Review templates** + per-project report
- **Public REST API** (OpenAPI at `/docs`)
- **Reference self-host** (Docker Compose), multi-tenant with Postgres RLS

## Open Core boundary

The **Enterprise** offering (managed SaaS, **multi-agent** AppSec AI,
GitHub/GitLab/Jira/Confluence integrations, SSO/SCIM, billing, support) is
commercial and lives in a separate repository. This framework works **without** it.
See the [home page](index.md) for the open-vs-Enterprise table.

## License & trademarks

- Code: **Apache-2.0** (see `LICENSE`).
- "OWASP" and the OWASP logo are trademarks of the **OWASP Foundation**, used here
  only descriptively and not as a claim of affiliation.
- Other product names (Jira, Confluence, GitHub, GitLab, AWS, etc.) are trademarks
  of their respective owners.
