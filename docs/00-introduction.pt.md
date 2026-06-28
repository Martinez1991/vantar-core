# Introdução & status do projeto

## ⚠️ Aviso de afiliação

**O `vantar-core` ainda não é um projeto OWASP.** "OWASP" é uma marca registrada da
OWASP Foundation, e o nome/logo só podem ser usados após um projeto ser
formalmente aceito. Até lá, este trabalho é um **rascunho comunitário
independente**. A marca OWASP neste repositório está **intencionalmente retida** e
só será habilitada mediante aceitação no **OWASP Incubator**.

O que isso significa na prática:

- Este repositório **não** usa o nome OWASP como reivindicação de afiliação, nem o
  logo da OWASP. Referências à OWASP descrevem uma **aspiração** (submeter ao OWASP
  Incubator) e a **complementaridade** com o projeto existente OWASP ThreatAtlas —
  nunca uma afiliação já existente.
- A metodologia do projeto se alinha aos padrões OWASP (ASVS, STRIDE), mas
  alinhamento não é endosso.
- Se e quando o projeto for aceito no OWASP Incubator, a marca será habilitada e
  este aviso atualizado.

## O que é este projeto

Um framework aberto e **neutro em relação a fornecedores** para **Security Design
Review** na fase de design (*Shift-Left Security*). Entrega o conteúdo e a API;
**não compete** com o OWASP ThreatAtlas — **integra** com ele (push/pull), que
permanece o system-of-record colaborativo de threat modeling.

Conteúdo aberto:

- **Questionários de arquitetura** + pontuação de maturidade
- **Framework de análise de risco** (probabilidade × impacto, residual, aceitação)
- **Biblioteca de requisitos ASVS**
- **Threat Modeling** (gerador/curador STRIDE + **integração ThreatAtlas**)
- **AI Security Design Review** — um **agente único** com **prompt básico** (uma
  chamada ao LLM + fallback heurístico STRIDE)
- **Templates de Security Review** + relatório por projeto
- **API REST pública** (OpenAPI em `/docs`)
- **Self-host de referência** (Docker Compose), multi-tenant com RLS no Postgres

## Fronteira Open Core

A oferta **Enterprise** (SaaS gerenciado, IA AppSec **multi-agente**, integrações
GitHub/GitLab/Jira/Confluence, SSO/SCIM, billing, suporte) é comercial e vive em um
repositório separado. Este framework funciona **sem** ela. Veja a [página
inicial](index.md) para a tabela aberto×Enterprise.

## Licença & marcas

- Código: **Apache-2.0** (veja `LICENSE`).
- "OWASP" e o logo da OWASP são marcas da **OWASP Foundation**, usadas aqui apenas
  descritivamente e não como reivindicação de afiliação.
- Outros nomes de produtos (Jira, Confluence, GitHub, GitLab, AWS, etc.) são marcas
  de seus respectivos donos.
