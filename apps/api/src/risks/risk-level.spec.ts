import { riskLevel, riskScore } from "./risk-level";

describe("risk-level (P×I — RF-RSK-002)", () => {
  it("calcula o score como likelihood × impact", () => {
    expect(riskScore(4, 5)).toBe(20);
    expect(riskScore(1, 1)).toBe(1);
  });

  it("mapeia para 4 níveis pelos limites corretos", () => {
    expect(riskLevel(1, 1)).toBe("low"); // 1
    expect(riskLevel(2, 2)).toBe("low"); // 4
    expect(riskLevel(2, 3)).toBe("medium"); // 6
    expect(riskLevel(3, 3)).toBe("medium"); // 9
    expect(riskLevel(2, 5)).toBe("high"); // 10
    expect(riskLevel(3, 4)).toBe("high"); // 12
    expect(riskLevel(3, 5)).toBe("critical"); // 15
    expect(riskLevel(5, 5)).toBe("critical"); // 25
  });
});
