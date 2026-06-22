/**
 * Catálogo de questionários (dados de referência, tenant-agnósticos) — RF-QST-001.
 * Cada template mapeia perguntas a um framework e a um controle específico.
 * Mantido em código (não em tabela) por ser conhecimento versionado.
 */
export type Question = {
  id: string;
  text: string;
  control: string; // referência ao framework (ex.: "A01:2021")
  weight: number;
};

export type QuestionnaireTemplate = {
  id: string;
  name: string;
  framework: string;
  description: string;
  questions: Question[];
};

const q = (id: string, control: string, text: string, weight = 1): Question => ({
  id,
  control,
  text,
  weight,
});

export const CATALOG: QuestionnaireTemplate[] = [
  {
    id: "owasp-top10",
    name: "OWASP Top 10 (2021)",
    framework: "OWASP Top 10",
    description: "Os 10 riscos mais críticos em aplicações web.",
    questions: [
      q("a01", "A01:2021", "Controle de acesso é verificado server-side em toda rota (deny-by-default, sem IDOR)?"),
      q("a02", "A02:2021", "Dados sensíveis são cifrados em trânsito (TLS 1.2+) e em repouso?"),
      q("a03", "A03:2021", "Entradas são validadas e consultas usam parametrização/ORM (sem concatenação)?"),
      q("a04", "A04:2021", "Há threat modeling e requisitos de segurança na fase de design?"),
      q("a05", "A05:2021", "Hardening aplicado e headers de segurança (CSP, HSTS) configurados?"),
      q("a06", "A06:2021", "Dependências são monitoradas (SCA/SBOM) e mantidas atualizadas?"),
      q("a07", "A07:2021", "MFA disponível e proteção contra brute force/credential stuffing?"),
      q("a08", "A08:2021", "Pipelines verificam integridade (assinaturas, SRI) e usam fontes confiáveis?"),
      q("a09", "A09:2021", "Eventos de segurança são logados e monitorados com alertas?"),
      q("a10", "A10:2021", "Requisições server-side validam destino (allowlist) contra SSRF?"),
    ],
  },
  {
    id: "owasp-asvs-l1",
    name: "OWASP ASVS (Nível 1)",
    framework: "OWASP ASVS",
    description: "Verificações essenciais do Application Security Verification Standard.",
    questions: [
      q("v2", "V2 Authentication", "Política de senhas e armazenamento com hashing forte (bcrypt/argon2)?"),
      q("v3", "V3 Session", "Sessões com tokens seguros, expiração e invalidação no logout?"),
      q("v4", "V4 Access Control", "Autorização por papéis com princípio do menor privilégio?"),
      q("v5", "V5 Validation", "Saídas codificadas para prevenir XSS?"),
      q("v7", "V7 Logging", "Erros não vazam stack trace/segredos ao usuário?"),
      q("v8", "V8 Data Protection", "Dados sensíveis classificados e protegidos conforme política?"),
      q("v9", "V9 Communications", "Comunicação apenas por canais cifrados (TLS), sem fallback inseguro?"),
      q("v12", "V12 Files", "Upload valida tipo/tamanho e armazena fora da raiz web?"),
    ],
  },
  {
    id: "nist-csf",
    name: "NIST CSF",
    framework: "NIST CSF",
    description: "As cinco funções do Cybersecurity Framework.",
    questions: [
      q("id", "Identify", "Ativos, dados e riscos do sistema estão inventariados?"),
      q("pr", "Protect", "Controles de proteção (acesso, cripto, treinamento) implementados?"),
      q("de", "Detect", "Há detecção contínua de eventos anômalos?"),
      q("rs", "Respond", "Existe plano de resposta a incidentes testado?"),
      q("rc", "Recover", "Há plano de recuperação/continuidade (backups, RTO/RPO)?"),
    ],
  },
  {
    id: "lgpd",
    name: "LGPD",
    framework: "LGPD",
    description: "Aderência à Lei Geral de Proteção de Dados.",
    questions: [
      q("base", "Art. 7º", "Há base legal definida para cada tratamento de dados pessoais?"),
      q("consent", "Art. 8º", "Consentimento é coletado e gerenciável quando aplicável?"),
      q("rights", "Art. 18", "Atende aos direitos do titular (acesso, correção, exclusão)?"),
      q("minim", "Art. 6º", "Coleta é limitada ao necessário (minimização)?"),
      q("retention", "Art. 15-16", "Política de retenção e descarte de dados definida?"),
      q("breach", "Art. 48", "Há processo de notificação de incidentes à ANPD?"),
    ],
  },
];

export function getTemplate(id: string): QuestionnaireTemplate | undefined {
  return CATALOG.find((t) => t.id === id);
}
