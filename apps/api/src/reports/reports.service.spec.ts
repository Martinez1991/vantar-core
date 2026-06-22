import { NotFoundException } from "@nestjs/common";
import { mockRepo } from "../test-utils";
import { ReportsService } from "./reports.service";

function make() {
  const projects = mockRepo();
  const questionnaires = mockRepo();
  const risks = mockRepo();
  const models = mockRepo();
  const threats = mockRepo();
  const reqs = mockRepo();
  const service = new ReportsService(
    projects as any, questionnaires as any, risks as any,
    models as any, threats as any, reqs as any,
  );
  return { service, projects, questionnaires, risks, models, threats, reqs };
}

describe("ReportsService.build", () => {
  it("agrega domínios e computa o resumo executivo", async () => {
    const { service, projects, questionnaires, risks, models, threats, reqs } = make();
    projects.findOne.mockResolvedValue({
      id: "p1", name: "PagFlow", owner: "Pay", description: null,
      criticality: "Crítica", environment: "Cloud", dataClasses: ["PCI"], securityScore: 70,
    });
    questionnaires.find.mockResolvedValue([
      { templateId: "owasp-top10", securityScore: 80, maturityLevel: "Intermediário", status: "completed", answers: {} },
    ]);
    risks.find.mockResolvedValue([
      { title: "IDOR", likelihood: 4, impact: 5, status: "open", residualLikelihood: null, residualImpact: null, category: null },
    ]);
    models.find.mockResolvedValue([{ id: "m1" }]);
    threats.find.mockResolvedValue([{ threatModelId: "m1", category: "Spoofing", status: "open" }]);
    reqs.find.mockResolvedValue([
      { code: "REQ-CRYPTO-001", title: "TLS", framework: "ASVS", control: "V9", status: "proposed" },
    ]);

    const r = await service.build("t1", "p1");
    expect(r.summary.posture).toBe("Crítico"); // 1 risco crítico aberto
    expect(r.summary.avgScore).toBe(80);
    expect(r.summary.criticalRisks).toBe(1);
    expect(r.risks.byLevel.critical).toBe(1);
    expect(r.threatModeling.totalThreats).toBe(1);
    expect(r.requirements.byStatus.proposed).toBe(1);
    expect(r.summary.headline).toMatch(/cr[ií]tic/i);
  });

  it("projeto inexistente → NotFound", async () => {
    const { service, projects } = make();
    projects.findOne.mockResolvedValue(null);
    await expect(service.build("t1", "x")).rejects.toBeInstanceOf(NotFoundException);
  });
});
