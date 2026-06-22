import { QuestionnaireTemplate } from "./questionnaire-catalog";

// Resposta por pergunta — RF-QST-002.
export type AnswerValue = "yes" | "partial" | "no" | "na";

export type Answer = {
  value: AnswerValue;
  justification?: string;
  evidence?: string;
};

export type Answers = Record<string, Answer>;

export type MaturityLevel = "Inicial" | "Básico" | "Intermediário" | "Avançado";
export type RiskLevel = "low" | "medium" | "high" | "critical";

const VALUE_WEIGHT: Record<Exclude<AnswerValue, "na">, number> = {
  yes: 1,
  partial: 0.5,
  no: 0,
};

export type Scoring = {
  securityScore: number; // 0–100
  maturityLevel: MaturityLevel;
  riskLevel: RiskLevel;
  answered: number;
  total: number;
  completion: number; // 0–100
};

/**
 * Calcula Security Score, Maturidade e Nível de Risco a partir das respostas —
 * RF-QST-003. Respostas "N/A" são excluídas do denominador.
 */
export function score(template: QuestionnaireTemplate, answers: Answers): Scoring {
  let weighted = 0;
  let applicableWeight = 0;
  let answered = 0;

  for (const question of template.questions) {
    const a = answers[question.id];
    if (!a) continue;
    answered += 1;
    if (a.value === "na") continue;
    applicableWeight += question.weight;
    weighted += question.weight * VALUE_WEIGHT[a.value];
  }

  const securityScore =
    applicableWeight > 0 ? Math.round((weighted / applicableWeight) * 100) : 0;
  const total = template.questions.length;

  return {
    securityScore,
    maturityLevel: maturityFromScore(securityScore),
    riskLevel: riskFromScore(securityScore),
    answered,
    total,
    completion: total > 0 ? Math.round((answered / total) * 100) : 0,
  };
}

export function maturityFromScore(s: number): MaturityLevel {
  if (s >= 85) return "Avançado";
  if (s >= 65) return "Intermediário";
  if (s >= 40) return "Básico";
  return "Inicial";
}

// Score alto = risco baixo (inverso).
export function riskFromScore(s: number): RiskLevel {
  if (s >= 85) return "low";
  if (s >= 65) return "medium";
  if (s >= 40) return "high";
  return "critical";
}
