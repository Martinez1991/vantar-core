# Segurança (núcleo aberto)

O Vantar faz *dogfooding* do próprio domínio: segue OWASP ASVS/STRIDE e práticas
de design seguro. Esta página cobre os controles do **núcleo aberto**.

## Identidade & acesso

- **JWT RS256** com rotação de **refresh token** (hash SHA-256; rotação a cada uso).
- **MFA TOTP** (otplib) opcional por usuário.
- **RBAC**: `owner` / `admin` / `appsec` / `developer` / `viewer`.
- **Account lockout / anti brute-force** (SEC-03): após **5** falhas consecutivas
  a conta é bloqueada por janela **exponencial** (15→60min); sucesso zera o
  contador; falhas de MFA também contam. Configurável por env
  (`AUTH_LOCKOUT_THRESHOLD` / `_BASE_MINUTES` / `_MAX_MINUTES`).
- Senhas com **bcrypt**; segredos nunca retornam em respostas nem em logs.

## Isolamento de tenant (RLS)

Defesa em profundidade: queries escopadas por `tenantId` **e** Row-Level Security
forçada no banco (role não-superuser `vantar_app` + política `tenant_isolation`
via `app.current_tenant`). Um tenant não enxerga dados de outro mesmo em caso de
query mal escopada.

## Guardrails de IA

- **Sanitização anti prompt-injection**: padrões de injeção são neutralizados nas
  entradas (IaC/OpenAPI/descrição) antes do LLM (RS-LLM-001).
- **Redaction de PII/segredos** antes do LLM (e-mail, CPF, cartão, chaves AWS,
  JWT, private keys…): nada sensível trafega para o modelo (RS-LLM-002).
- **Egress / anti-SSRF** (SEC-02): toda saída HTTP do AI plane passa por um guard
  que aceita só http/https, **bloqueia sempre o IMDS** (169.254.169.254) e recusa
  faixas privadas/loopback salvo allowlist (host do Ollama é confiável). Ver
  [IA](ai.md) e OWASP LLM Top 10.

## Cabeçalhos & transporte

**Helmet** (CSP/headers de segurança), **CORS** por allowlist (env), validação e
sanitização globais (`class-validator`, whitelist + `forbidNonWhitelisted`).

## Primitivas de criptografia (para a Enterprise)

O `common/` expõe primitivas abertas reutilizáveis:

- **`secret-cipher`** — cifra simétrica **AES-256-GCM** (formato versionado
  `enc:v1:`), pronta como *column transformer* TypeORM e **KMS-ready**. No núcleo
  aberto não há segredos de integração a cifrar; a Enterprise liga essa primitiva
  aos tokens Jira/SCM/Confluence e ao client secret OIDC (SEC-01).
- **`ssrf-guard`** — `assertPublicHttpUrl` (resolve o host e recusa privado/IMDS),
  usado pela Enterprise no fetch server-side do issuer OIDC.

## Supply chain

Imagens assinadas com **cosign** (keyless) + **proveniência SLSA** no release.
Recomenda-se SCA/SAST/secret-scan no CI (dogfooding do próprio Security Gate).

## Threat modeling

O módulo `threat-modeling` gera/curadoria **STRIDE** e sincroniza com o **OWASP
ThreatAtlas** (system-of-record colaborativo) via API Tokens.
