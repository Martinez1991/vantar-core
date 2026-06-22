import { NotFoundException } from "@nestjs/common";
import { mockRepo } from "../test-utils";
import { RequirementsService } from "./requirements.service";
import { RequirementStatus } from "./requirement.entity";

function make() {
  const templates = mockRepo();
  const reqs = mockRepo();
  const projects = mockRepo();
  const threats = mockRepo();
  const models = mockRepo();
  const service = new RequirementsService(
    templates as any,
    reqs as any,
    projects as any,
    threats as any,
    models as any,
  );
  return { service, templates, reqs, projects, threats, models };
}

describe("RequirementsService", () => {
  it("applyTemplate copia campos e cria como proposto (source library)", async () => {
    const { service, templates, projects, reqs } = make();
    projects.findOne.mockResolvedValue({ id: "p1", tenantId: "t1" });
    templates.findOne.mockResolvedValue({
      id: "tpl1", code: "REQ-AUTH-001", title: "MFA", description: "d",
      framework: "ASVS", control: "V2",
    });
    await service.applyTemplate("t1", "p1", "tpl1");
    const saved = reqs.save.mock.calls[0][0];
    expect(saved.code).toBe("REQ-AUTH-001");
    expect(saved.status).toBe(RequirementStatus.Proposed);
    expect(saved.source).toBe("library");
  });

  it("approve registra aprovador e data", async () => {
    const { service, reqs } = make();
    reqs.findOne.mockResolvedValue({ id: "rq1", tenantId: "t1", status: "proposed" });
    const res = await service.approve("t1", "rq1", "admin@vantar.local");
    expect(res.status).toBe(RequirementStatus.Approved);
    expect(res.approvedBy).toBe("admin@vantar.local");
    expect(res.approvedAt).toBeInstanceOf(Date);
  });

  it("reject define motivo e limpa aprovador", async () => {
    const { service, reqs } = make();
    reqs.findOne.mockResolvedValue({ id: "rq1", tenantId: "t1", status: "proposed", approvedBy: "x" });
    const res = await service.reject("t1", "rq1", "fora de escopo");
    expect(res.status).toBe(RequirementStatus.Rejected);
    expect(res.rejectionReason).toBe("fora de escopo");
    expect(res.approvedBy).toBeNull();
  });

  it("fromThreat mapeia STRIDE→requisito e vincula a ameaça", async () => {
    const { service, threats, models, reqs } = make();
    threats.findOne.mockResolvedValue({
      id: "th1", tenantId: "t1", threatModelId: "m1", category: "Spoofing",
      title: "Spoofing em API", elementName: "API (Processo)", description: null,
    });
    models.findOne.mockResolvedValue({ id: "m1", tenantId: "t1", projectId: "p1" });
    await service.fromThreat("t1", "th1");
    const saved = reqs.save.mock.calls[0][0];
    expect(saved.code).toBe("REQ-AUTH"); // mapa STRIDE Spoofing → ASVS V2
    expect(saved.framework).toBe("ASVS");
    expect(saved.threatId).toBe("th1");
    expect(saved.source).toBe("threat");
  });

  it("createCustom valida projeto", async () => {
    const { service, projects } = make();
    projects.findOne.mockResolvedValue(null);
    await expect(
      service.createCustom("t1", "pX", { code: "X", title: "t", framework: "ASVS", control: "V1" } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("removeTemplate inexistente → NotFound", async () => {
    const { service, templates } = make();
    templates.findOne.mockResolvedValue(null);
    await expect(service.removeTemplate("t1", "x")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("biblioteca: list/create/update/remove", async () => {
    const { service, templates } = make();
    templates.find.mockResolvedValue([{ id: "tpl1" }]);
    expect(await service.listTemplates("t1")).toHaveLength(1);
    await service.createTemplate("t1", { code: "REQ-X", title: "X", framework: "ASVS", control: "V1" } as any);
    expect(templates.save).toHaveBeenCalled();
    templates.findOne.mockResolvedValue({ id: "tpl1", title: "Old" });
    const upd = await service.updateTemplate("t1", "tpl1", { title: "New" } as any);
    expect(upd.title).toBe("New");
    const del = await service.removeTemplate("t1", "tpl1");
    expect(del).toEqual({ id: "tpl1" });
  });

  it("listAll / listForProject delegam ao repo", async () => {
    const { service, reqs } = make();
    reqs.find.mockResolvedValue([{ id: "rq1" }]);
    expect(await service.listAll("t1")).toHaveLength(1);
    expect(await service.listForProject("t1", "p1")).toHaveLength(1);
  });

  it("markImplemented e remove", async () => {
    const { service, reqs } = make();
    reqs.findOne.mockResolvedValue({ id: "rq1", tenantId: "t1", status: "approved" });
    const res = await service.markImplemented("t1", "rq1");
    expect(res.status).toBe(RequirementStatus.Implemented);
    const del = await service.remove("t1", "rq1");
    expect(del).toEqual({ id: "rq1" });
  });
});
