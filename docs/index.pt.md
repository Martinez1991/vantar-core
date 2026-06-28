# Vantar Core — Security Design Review Framework

> Núcleo **aberto** (Apache-2.0) do Vantar: uma plataforma headless de **Security
> Design Review** — questionários de arquitetura, framework de risco, biblioteca
> de requisitos (ASVS), threat modeling (STRIDE) e um **agente único** de IA para
> revisão de segurança. Complementar ao [OWASP ThreatAtlas](https://owasp.org/) —
> integra, não reimplementa.

!!! warning "Aviso de afiliação"
    O `vantar-core` **ainda não é um projeto OWASP**. "OWASP" é marca registrada da
    OWASP Foundation, e o nome/logo só podem ser usados após a aceitação formal de
    um projeto. Até lá, este é um **rascunho comunitário independente**. A marca
    OWASP está intencionalmente retida e só será habilitada mediante aceitação no
    OWASP Incubator. Veja a [Introdução](00-introduction.md).

## O que é (e o que não é)

Vantar é **Open Core**. Esta documentação cobre **apenas o núcleo aberto**
(`vantar-core`). Recursos comerciais ficam na Enterprise e **não** são detalhados
aqui.

| Aberto (este repositório) | Enterprise (não coberto aqui) |
|---|---|
| API REST headless (NestJS), multi-tenant com RLS | IA **multi-agente** + operação gerenciada (SaaS) |
| Questionários de maturidade/arquitetura | Integrações Jira/SCM/Confluence (gate em PR) |
| Framework de risco (probabilidade × impacto) | SSO/OIDC/SAML + SCIM |
| Biblioteca de requisitos (ASVS) | Billing/assinaturas |
| Threat Modeling (gerador/curador STRIDE) + integração ThreatAtlas | Paridade ThreatAtlas gerenciada |
| **IA single-agent** (1 chamada LLM + fallback heurístico STRIDE) | — |
| API REST pública (OpenAPI) | — |
| Self-host de referência (Docker Compose) | — |

## Como ler

| Documento | Cobre |
|---|---|
| [Introdução](00-introduction.md) | Status do projeto, afiliação & marca OWASP, escopo |
| [Arquitetura](architecture.md) | Estilo, multi-tenant (RLS), plano de IA, topologia self-host |
| [Segurança](security.md) | AuthN/MFA/lockout, RLS, guardrails de IA, egress/anti-SSRF, supply chain |
| [IA](ai.md) | Single-agent design review, guardrails, OWASP LLM Top 10, fallback honesto |
| [API](api.md) | Recursos REST, autenticação, contratos, OpenAPI |
| [Self-host](self-host.md) | Subir localmente com Docker Compose, env, migrations |

## Stack

**NestJS 10 + TypeORM 0.3 + PostgreSQL/pgvector** (Business Plane headless),
**FastAPI** (AI Agent Plane, single-agent, chamado por HTTP), **Ollama** (LLM
self-host, opcional). Self-host de referência via Docker Compose (`postgres` +
`api` + `agents`), sem dependência de serviço proprietário de nuvem.

## Princípio de complementaridade (OWASP ThreatAtlas)

O OSS **gera o conteúdo** (DFDs, ameaças STRIDE, mitigações, scores) e
**sincroniza** com o ThreatAtlas via API Tokens (push/pull). Não recria o editor
visual, o versionamento nem a base colaborativa do ThreatAtlas — integra com ele.
