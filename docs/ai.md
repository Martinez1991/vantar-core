# AI — Security Design Review (single-agent)

> The open core does AI security review with **one agent** and a **basic prompt**.
> **Multi-agent** AI is Enterprise and is not covered here.

## How it works

1. The API enqueues a review job with the inputs (description, OpenAPI, Terraform,
   k8s manifests) — all **text**, never URLs to be fetched.
2. Inputs are **sanitized** (anti prompt-injection + PII/secret redaction) — see
   [Security](security.md).
3. The agent makes **one** LLM call (pluggable provider; **Ollama** by default for
   self-host) asking for structured STRIDE findings.
4. **Honest fallback**: if the LLM is unavailable or fails, the result comes from a
   **STRIDE heuristic** and is **labeled** as heuristic. AI generation is never
   faked.

## Guardrails (OWASP LLM Top 10)

| LLM risk | Open-core control |
|---|---|
| LLM01 Prompt Injection | Neutralization of injection patterns in inputs (untrusted input) |
| LLM02 Insecure Output | Output validated/structured before use |
| LLM06 Sensitive Info Disclosure | PII/secret redaction **before** sending to the LLM |
| LLM/SSRF (egress) | Egress guard: http/https only, **IMDS blocked**, private ranges unless allowlisted |

## Pluggable provider

`llm.py` abstracts the provider. For self-host, **Ollama** (`OLLAMA_URL`,
`OLLAMA_MODEL`). The egress guard is applied **before every** HTTP call — even when
pointing at an internal host, IMDS is always rejected.

> Choosing a **managed** LLM (e.g. Bedrock) is a SaaS/Enterprise operations
> decision; the open core runs 100% self-host with Ollama.
