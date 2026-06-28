# IA — Security Design Review (single-agent)

> O núcleo aberto faz a revisão de segurança por IA com **um agente** e um
> **prompt básico**. A IA **multi-agente** é Enterprise e não é coberta aqui.

## Como funciona

1. A API enfileira um job de review com as entradas (descrição, OpenAPI,
   Terraform, manifests k8s) — todas **texto**, nunca URLs baixadas.
2. As entradas são **sanitizadas** (anti prompt-injection + redaction de
   PII/segredos) — ver [Segurança](security.md).
3. O agente faz **uma** chamada ao LLM (provider plugável; **Ollama** por padrão
   no self-host) pedindo achados STRIDE estruturados.
4. **Fallback honesto**: se o LLM não estiver disponível ou falhar, o resultado
   vem de uma **heurística STRIDE** e é **rotulado** como heurístico. Nunca se
   finge geração por IA.

## Guardrails (OWASP LLM Top 10)

| Risco LLM | Controle no núcleo aberto |
|---|---|
| LLM01 Prompt Injection | Neutralização de padrões de injeção nas entradas (untrusted input) |
| LLM02 Insecure Output | Saída validada/estruturada antes de uso |
| LLM06 Sensitive Info Disclosure | Redaction de PII/segredos **antes** do envio ao LLM |
| LLM/SSRF (egress) | Guard de egress: só http/https, **IMDS bloqueado**, faixas privadas salvo allowlist |

## Provider plugável

`llm.py` abstrai o provider. No self-host, **Ollama** (`OLLAMA_URL`,
`OLLAMA_MODEL`). O guard de egress é aplicado **antes de cada chamada** HTTP —
mesmo apontando para um host interno, o IMDS é sempre recusado.

> A escolha de um LLM **gerenciado** (ex.: Bedrock) é uma decisão da operação
> SaaS/Enterprise; o núcleo aberto roda 100% self-host com Ollama.
