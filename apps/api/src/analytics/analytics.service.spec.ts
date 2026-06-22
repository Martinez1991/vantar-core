import { mockRepo } from "../test-utils";
import { AnalyticsService } from "./analytics.service";
import { RiskStatus } from "../risks/risk.entity";

function make() {
  const risks = mockRepo();
  const questionnaires = mockRepo();
  const threats = mockRepo();
  const projects = mockRepo();
  const snapshots = { list: jest.fn(async () => []) };
  const service = new AnalyticsService(
    risks as any, questionnaires as any, threats as any, projects as any, snapshots as any,
  );
  return { service, risks, questionnaires, threats, projects, snapshots };
}

describe("AnalyticsService.build", () => {
  it("agrega heatmap, status, compliance, maturidade, STRIDE e timeline", async () => {
    const { service, risks, questionnaires, threats, projects, snapshots } = make();
    snapshots.list.mockResolvedValue([
      { capturedAt: "2026-01-01", avgSecurityScore: 60, openRisks: 1, criticalRisks: 0 },
      { capturedAt: "2026-02-01", avgSecurityScore: 80, openRisks: 2, criticalRisks: 1 },
    ] as any);
    projects.find.mockResolvedValue([{ id: "p1", name: "PagFlow" }]);
    risks.find.mockResolvedValue([
      { projectId: "p1", title: "IDOR", likelihood: 4, impact: 5, status: RiskStatus.Open },
      { projectId: "p1", title: "DoS", likelihood: 3, impact: 4, status: RiskStatus.Mitigating },
      { projectId: "p1", title: "Velho", likelihood: 1, impact: 1, status: RiskStatus.Closed }, // fora do heatmap
    ]);
    questionnaires.find.mockResolvedValue([
      { templateId: "owasp-top10", securityScore: 80, maturityLevel: "Intermediário", completedAt: "2026-02-01T00:00:00Z" },
      { templateId: "owasp-top10", securityScore: 60, maturityLevel: "Básico", completedAt: "2026-01-01T00:00:00Z" },
      { templateId: "lgpd", securityScore: 90, maturityLevel: "Avançado", completedAt: null },
    ]);
    threats.find.mockResolvedValue([
      { category: "Spoofing" }, { category: "Spoofing" }, { category: "Tampering" },
    ]);

    const a = await service.build("t1");

    // heatmap: IDOR em [impact5-1][lik4-1] = [4][3]
    expect(a.riskHeatmap.matrix[4][3]).toBe(1);
    expect(a.riskHeatmap.total).toBe(2); // exclui closed

    expect(a.riskByStatus.open).toBe(1);
    expect(a.riskByStatus.treated).toBe(2); // mitigating + closed

    // compliance: OWASP Top 10 média (80+60)/2 = 70; LGPD 90
    const owasp = a.complianceByFramework.find((f) => f.framework === "OWASP Top 10");
    expect(owasp?.score).toBe(70);
    expect(a.complianceByFramework[0].framework).toBe("LGPD"); // maior score primeiro

    expect(a.maturityDistribution["Intermediário"]).toBe(1);
    expect(a.maturityDistribution["Avançado"]).toBe(1);

    expect(a.threatsByCategory.Spoofing).toBe(2);

    // timeline: a partir dos snapshots (série temporal)
    expect(a.maturityTimeline).toHaveLength(2);
    expect(a.maturityTimeline[0].score).toBe(60);

    // top riscos por score inerente: IDOR (20) primeiro
    expect(a.topRisks[0].title).toBe("IDOR");
    expect(a.topRisks[0].level).toBe("critical");
    expect(a.topRisks[0].project).toBe("PagFlow");
  });

  it("tenant vazio retorna agregações vazias", async () => {
    const { service } = make();
    const a = await service.build("t1");
    expect(a.riskHeatmap.total).toBe(0);
    expect(a.complianceByFramework).toEqual([]);
    expect(a.maturityTimeline).toEqual([]);
  });
});
