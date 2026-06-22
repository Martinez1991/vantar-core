/**
 * Classificação de risco por matriz Probabilidade × Impacto (RF-RSK-002),
 * inspirada na OWASP Risk Rating Methodology. Likelihood e Impact em escala
 * 1–5; o produto (1–25) é mapeado para 4 níveis alinhados às cores de risco.
 */
export type RiskLevel = "low" | "medium" | "high" | "critical";

export function riskScore(likelihood: number, impact: number): number {
  return likelihood * impact;
}

export function riskLevel(likelihood: number, impact: number): RiskLevel {
  const s = riskScore(likelihood, impact);
  if (s >= 15) return "critical";
  if (s >= 10) return "high";
  if (s >= 5) return "medium";
  return "low";
}
