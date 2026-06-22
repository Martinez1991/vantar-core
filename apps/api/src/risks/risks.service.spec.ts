import { NotFoundException } from "@nestjs/common";
import { mockRepo } from "../test-utils";
import { RisksService } from "./risks.service";
import { RiskStatus } from "./risk.entity";

function make() {
  const risks = mockRepo();
  const projects = mockRepo();
  const bus = { emit: jest.fn(), on: jest.fn() };
  const service = new RisksService(risks as any, projects as any, bus as any);
  return { service, risks, projects, bus };
}

const baseRisk = (over: any = {}) => ({
  id: "r1",
  tenantId: "t1",
  projectId: "p1",
  title: "IDOR",
  likelihood: 4,
  impact: 5,
  status: RiskStatus.Open,
  residualLikelihood: null,
  residualImpact: null,
  ...over,
});

describe("RisksService", () => {
  it("toResponse: nível inerente e efetivo (residual reduz)", async () => {
    const { service, risks } = make();
    risks.find.mockResolvedValue([
      baseRisk(),
      baseRisk({ id: "r2", residualLikelihood: 2, residualImpact: 2 }),
    ]);
    const res = await service.findAll("t1");
    expect(res[0].level).toBe("critical");
    expect(res[0].effectiveLevel).toBe("critical");
    expect(res[1].level).toBe("critical");
    expect(res[1].effectiveLevel).toBe("low"); // 2x2 residual
  });

  it("create: valida projeto e recalcula openRisks", async () => {
    const { service, risks, projects } = make();
    projects.findOne.mockResolvedValue({ id: "p1", tenantId: "t1" });
    risks.count.mockResolvedValue(2);
    const created = await service.create("t1", "p1", {
      title: "Novo",
      likelihood: 3,
      impact: 3,
    } as any);
    expect(created.level).toBe("medium");
    expect(projects.update).toHaveBeenCalledWith(
      { tenantId: "t1", id: "p1" },
      { openRisks: 2 },
    );
  });

  it("create: projeto inexistente → NotFound", async () => {
    const { service, projects } = make();
    projects.findOne.mockResolvedValue(null);
    await expect(
      service.create("t1", "pX", { title: "x", likelihood: 1, impact: 1 } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("accept: marca aceito com aprovador e data", async () => {
    const { service, risks } = make();
    risks.findOne.mockResolvedValue(baseRisk());
    const res = await service.accept("t1", "r1", {
      acceptedBy: "Ana",
      justification: "risco residual baixo",
    } as any);
    expect(res.status).toBe(RiskStatus.Accepted);
    expect(res.acceptedBy).toBe("Ana");
    expect(res.acceptedAt).toBeInstanceOf(Date);
  });

  it("update com plano move status para mitigating", async () => {
    const { service, risks } = make();
    risks.findOne.mockResolvedValue(baseRisk());
    const res = await service.update("t1", "r1", {
      mitigationPlan: "Aplicar verificação de ownership",
    } as any);
    expect(res.status).toBe(RiskStatus.Mitigating);
  });

  it("summary: distribuição por nível efetivo e contadores", async () => {
    const { service, risks } = make();
    risks.find.mockResolvedValue([
      baseRisk({ status: RiskStatus.Open }), // critical
      baseRisk({ id: "r2", likelihood: 2, impact: 3, status: RiskStatus.Mitigating }), // medium
      baseRisk({ id: "r3", likelihood: 1, impact: 1, status: RiskStatus.Accepted }), // low
      baseRisk({ id: "r4", status: RiskStatus.Closed }), // ignorado
    ]);
    const s = await service.summary("t1");
    expect(s.byLevel.critical).toBe(1);
    expect(s.byLevel.medium).toBe(1);
    expect(s.byLevel.low).toBe(1);
    expect(s.open).toBe(2); // open + mitigating
    expect(s.accepted).toBe(1);
  });

  it("findOne inexistente → NotFound", async () => {
    const { service, risks } = make();
    risks.findOne.mockResolvedValue(null);
    await expect(service.findOne("t1", "x")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("remove: apaga e recalcula", async () => {
    const { service, risks, projects } = make();
    risks.findOne.mockResolvedValue(baseRisk());
    risks.count.mockResolvedValue(0);
    const res = await service.remove("t1", "r1");
    expect(res).toEqual({ id: "r1" });
    expect(projects.update).toHaveBeenCalled();
  });
});
