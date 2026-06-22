jest.mock("typeorm-transactional", () => ({
  runInTransaction: (cb: () => unknown) => cb(),
}));

import { mockRepo } from "../test-utils";
import { SnapshotsService } from "./snapshots.service";
import { RiskStatus } from "../risks/risk.entity";
import { RequirementStatus } from "../requirements/requirement.entity";

function make() {
  const snapshots = mockRepo();
  const projects = mockRepo();
  const risks = mockRepo();
  const reqs = mockRepo();
  const tenants = mockRepo();
  const service = new SnapshotsService(
    snapshots as any, projects as any, risks as any, reqs as any, tenants as any,
  );
  return { service, snapshots, projects, risks, reqs, tenants };
}

describe("SnapshotsService", () => {
  it("capture: calcula métricas e cria snapshot do dia", async () => {
    const { service, snapshots, projects, risks, reqs } = make();
    projects.find.mockResolvedValue([{ securityScore: 70, archived: false }, { securityScore: 90, archived: false }]);
    risks.find.mockResolvedValue([
      { status: RiskStatus.Open, likelihood: 4, impact: 5, residualLikelihood: null, residualImpact: null },
      { status: RiskStatus.Mitigating, likelihood: 2, impact: 2, residualLikelihood: null, residualImpact: null },
      { status: RiskStatus.Closed, likelihood: 5, impact: 5, residualLikelihood: null, residualImpact: null },
    ]);
    reqs.find.mockResolvedValue([{ status: RequirementStatus.Approved }, { status: RequirementStatus.Proposed }]);
    snapshots.findOne.mockResolvedValue(null);

    await service.capture("t1");
    const saved = snapshots.save.mock.calls[0][0];
    expect(saved.avgSecurityScore).toBe(80);
    expect(saved.projectCount).toBe(2);
    expect(saved.openRisks).toBe(2);
    expect(saved.criticalRisks).toBe(1); // só o aberto 4×5 (closed não conta)
    expect(saved.requirementsApproved).toBe(1);
    expect(saved.requirementsTotal).toBe(2);
  });

  it("capture: upsert quando já existe snapshot do dia", async () => {
    const { service, snapshots, projects, risks, reqs } = make();
    const existing: any = { id: "s1", avgSecurityScore: 0 };
    snapshots.findOne.mockResolvedValue(existing);
    projects.find.mockResolvedValue([{ securityScore: 50, archived: false }]);
    risks.find.mockResolvedValue([]);
    reqs.find.mockResolvedValue([]);
    await service.capture("t1");
    expect(existing.avgSecurityScore).toBe(50);
    expect(snapshots.save).toHaveBeenCalledWith(existing);
  });

  it("captureAll: seta o GUC e captura por tenant", async () => {
    const { service, snapshots, tenants, projects, risks, reqs } = make();
    tenants.find.mockResolvedValue([{ id: "t1" }, { id: "t2" }]);
    projects.find.mockResolvedValue([]);
    risks.find.mockResolvedValue([]);
    reqs.find.mockResolvedValue([]);
    snapshots.findOne.mockResolvedValue(null);
    await service.captureAll();
    expect(snapshots.query).toHaveBeenCalledWith(expect.stringContaining("set_config"), ["t1"]);
    expect(snapshots.save).toHaveBeenCalledTimes(2);
  });
});
