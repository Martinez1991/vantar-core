"""Catálogo STRIDE e mapa STRIDE→requisito — espelha o Business Plane (TS).

Mantido em código porque é conhecimento de referência (não-IA): permite gerar
ameaças e requisitos candidatos de forma determinística (RF-TM-008 / RF-REQ).
"""
from __future__ import annotations

# STRIDE aplicável por tipo de elemento do DFD (mapeamento clássico).
STRIDE_BY_TYPE: dict[str, list[str]] = {
    "external": ["Spoofing", "Repudiation"],
    "process": [
        "Spoofing",
        "Tampering",
        "Repudiation",
        "Information Disclosure",
        "Denial of Service",
        "Elevation of Privilege",
    ],
    "datastore": [
        "Tampering",
        "Repudiation",
        "Information Disclosure",
        "Denial of Service",
    ],
    "boundary": [],
}

STRIDE_MITIGATION: dict[str, str] = {
    "Spoofing": "Autenticação forte (MFA/OIDC) e verificação de identidade.",
    "Tampering": "Integridade: validação de entrada, assinaturas/hashes, controle de versão.",
    "Repudiation": "Logs de auditoria imutáveis e não-repúdio (trilha assinada).",
    "Information Disclosure": "Criptografia em trânsito/repouso e mínimo privilégio de acesso.",
    "Denial of Service": "Rate limiting, quotas, autoescala e proteção de borda (WAF).",
    "Elevation of Privilege": "Autorização server-side, RBAC e princípio do menor privilégio.",
}

# STRIDE → requisito de segurança (controle ASVS) correlato.
STRIDE_REQUIREMENT: dict[str, dict[str, str]] = {
    "Spoofing": {"code": "REQ-AUTH", "framework": "ASVS", "control": "V2 Authentication",
                 "title": "Autenticação forte e verificação de identidade"},
    "Tampering": {"code": "REQ-INTEGRITY", "framework": "ASVS", "control": "V5 Validation & Integrity",
                  "title": "Integridade e validação de dados"},
    "Repudiation": {"code": "REQ-AUDIT", "framework": "ASVS", "control": "V7 Logging",
                    "title": "Trilha de auditoria não-repudiável"},
    "Information Disclosure": {"code": "REQ-CONFID", "framework": "ASVS", "control": "V8/V9 Data Protection",
                               "title": "Confidencialidade de dados"},
    "Denial of Service": {"code": "REQ-AVAIL", "framework": "OWASP", "control": "API4:2023 Resource Consumption",
                          "title": "Proteção de disponibilidade"},
    "Elevation of Privilege": {"code": "REQ-AC", "framework": "ASVS", "control": "V4 Access Control",
                               "title": "Controle de acesso e menor privilégio"},
}

ELEMENT_TYPE_LABEL = {
    "external": "Entidade externa",
    "process": "Processo",
    "datastore": "Data store",
    "boundary": "Trust boundary",
}
