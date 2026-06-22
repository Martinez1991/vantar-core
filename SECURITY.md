# Política de Segurança

## Reportar uma vulnerabilidade

**Não** abra issues públicas para vulnerabilidades de segurança.

Use o **GitHub Private Vulnerability Reporting** (aba *Security* →
*Report a vulnerability*) ou envie um e-mail para **security@vantar.dev**.

Inclua, quando possível:

- descrição e impacto;
- passos para reproduzir (PoC);
- versão/commit afetado;
- mitigação sugerida.

Faremos a triagem e responderemos o mais rápido possível. Pedimos
**divulgação coordenada**: dê-nos um prazo razoável para corrigir antes de
tornar o problema público. Reconhecemos publicamente quem reporta (se desejado).

## Escopo

- Núcleo aberto (OWASP Security Design Review Framework) e a implementação de
  referência neste repositório.
- Práticas já adotadas: RLS multi-tenant, JWT RS256 + refresh com rotação, MFA
  TOTP, rate limiting, security headers, auditoria imutável, imagens assinadas
  (cosign) com proveniência SLSA. Ver [`docs/supply-chain.md`](docs/supply-chain.md).

## Versões suportadas

Enquanto o projeto está em desenvolvimento inicial (`0.x`), apenas o último
`main`/release recebe correções de segurança.
