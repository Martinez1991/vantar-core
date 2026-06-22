import { getTemplate } from "./questionnaire-catalog";
import { maturityFromScore, riskFromScore, score, type Answers } from "./scoring";

const nist = getTemplate("nist-csf")!; // 5 perguntas, peso 1

function answersAll(value: "yes" | "no" | "partial" | "na"): Answers {
  return Object.fromEntries(nist.questions.map((q) => [q.id, { value }]));
}

describe("scoring (RF-QST-003)", () => {
  it("100 quando tudo é 'yes'", () => {
    const s = score(nist, answersAll("yes"));
    expect(s.securityScore).toBe(100);
    expect(s.maturityLevel).toBe("Avançado");
    expect(s.riskLevel).toBe("low");
    expect(s.completion).toBe(100);
  });

  it("0 quando tudo é 'no'", () => {
    const s = score(nist, answersAll("no"));
    expect(s.securityScore).toBe(0);
    expect(s.maturityLevel).toBe("Inicial");
    expect(s.riskLevel).toBe("critical");
  });

  it("'partial' vale meio ponto", () => {
    const s = score(nist, answersAll("partial"));
    expect(s.securityScore).toBe(50);
  });

  it("'na' é excluído do denominador", () => {
    const ids = nist.questions.map((q) => q.id);
    const answers: Answers = {
      [ids[0]]: { value: "yes" },
      [ids[1]]: { value: "na" }, // ignorado
    };
    const s = score(nist, answers);
    expect(s.securityScore).toBe(100); // 1 aplicável, respondido yes
    expect(s.answered).toBe(2);
  });

  it("limites de maturidade e risco", () => {
    expect(maturityFromScore(85)).toBe("Avançado");
    expect(maturityFromScore(65)).toBe("Intermediário");
    expect(maturityFromScore(40)).toBe("Básico");
    expect(maturityFromScore(39)).toBe("Inicial");
    expect(riskFromScore(85)).toBe("low");
    expect(riskFromScore(64)).toBe("high");
    expect(riskFromScore(39)).toBe("critical");
  });
});
