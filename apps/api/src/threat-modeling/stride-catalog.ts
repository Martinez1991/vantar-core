/**
 * Catálogo STRIDE (RF-TM-002/008) — dados de referência. Mapeia cada tipo de
 * elemento do DFD às categorias STRIDE aplicáveis e a uma mitigação genérica,
 * permitindo gerar ameaças candidatas sem IA (o curador humano refina depois).
 */
export type ElementType = "external" | "process" | "datastore" | "boundary";

export type Stride =
  | "Spoofing"
  | "Tampering"
  | "Repudiation"
  | "Information Disclosure"
  | "Denial of Service"
  | "Elevation of Privilege";

export const STRIDE_LABEL_PT: Record<Stride, string> = {
  Spoofing: "Spoofing (falsificação de identidade)",
  Tampering: "Tampering (adulteração)",
  Repudiation: "Repúdio",
  "Information Disclosure": "Vazamento de informação",
  "Denial of Service": "Negação de serviço",
  "Elevation of Privilege": "Elevação de privilégio",
};

/** STRIDE aplicável por tipo de elemento (mapeamento clássico). */
export const STRIDE_BY_TYPE: Record<ElementType, Stride[]> = {
  external: ["Spoofing", "Repudiation"],
  process: [
    "Spoofing",
    "Tampering",
    "Repudiation",
    "Information Disclosure",
    "Denial of Service",
    "Elevation of Privilege",
  ],
  datastore: [
    "Tampering",
    "Repudiation",
    "Information Disclosure",
    "Denial of Service",
  ],
  boundary: [], // trust boundary é contexto, não gera ameaça por si só
};

/** Mitigação sugerida por categoria STRIDE. */
export const STRIDE_MITIGATION: Record<Stride, string> = {
  Spoofing: "Autenticação forte (MFA/OIDC) e verificação de identidade.",
  Tampering: "Integridade: validação de entrada, assinaturas/hashes, controle de versão.",
  Repudiation: "Logs de auditoria imutáveis e não-repúdio (trilha assinada).",
  "Information Disclosure": "Criptografia em trânsito/repouso e mínimo privilégio de acesso.",
  "Denial of Service": "Rate limiting, quotas, autoescala e proteção de borda (WAF).",
  "Elevation of Privilege": "Autorização server-side, RBAC e princípio do menor privilégio.",
};

export const ELEMENT_TYPE_LABEL: Record<ElementType, string> = {
  external: "Entidade externa",
  process: "Processo",
  datastore: "Data store",
  boundary: "Trust boundary",
};
