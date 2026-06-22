import type { Stride } from "../threat-modeling/stride-catalog";

/**
 * Mapeia cada categoria STRIDE a um requisito de segurança correlato
 * (controle ASVS) — base para gerar requisito a partir de uma ameaça
 * (rastreabilidade ameaça → requisito).
 */
export const STRIDE_REQUIREMENT: Record<
  Stride,
  { code: string; framework: string; control: string; title: string; description: string }
> = {
  Spoofing: {
    code: "REQ-AUTH",
    framework: "ASVS",
    control: "V2 Authentication",
    title: "Autenticação forte e verificação de identidade",
    description: "Exigir autenticação robusta (MFA/OIDC) e validar a identidade nas fronteiras de confiança.",
  },
  Tampering: {
    code: "REQ-INTEGRITY",
    framework: "ASVS",
    control: "V5 Validation & Integrity",
    title: "Integridade e validação de dados",
    description: "Validar entradas e garantir integridade (assinaturas/hashes, parametrização).",
  },
  Repudiation: {
    code: "REQ-AUDIT",
    framework: "ASVS",
    control: "V7 Logging",
    title: "Trilha de auditoria não-repudiável",
    description: "Registrar ações sensíveis em log imutável para não-repúdio.",
  },
  "Information Disclosure": {
    code: "REQ-CONFID",
    framework: "ASVS",
    control: "V8/V9 Data Protection",
    title: "Confidencialidade de dados",
    description: "Criptografar dados em trânsito/repouso e aplicar mínimo privilégio de acesso.",
  },
  "Denial of Service": {
    code: "REQ-AVAIL",
    framework: "OWASP",
    control: "API4:2023 Resource Consumption",
    title: "Proteção de disponibilidade",
    description: "Aplicar rate limiting, quotas e proteção de borda (WAF) contra abuso/DoS.",
  },
  "Elevation of Privilege": {
    code: "REQ-AC",
    framework: "ASVS",
    control: "V4 Access Control",
    title: "Controle de acesso e menor privilégio",
    description: "Autorização server-side baseada em papéis, deny-by-default e menor privilégio.",
  },
};
