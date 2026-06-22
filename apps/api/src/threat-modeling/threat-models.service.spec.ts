import { BadRequestException } from "@nestjs/common";
import { mockRepo } from "../test-utils";
import { ThreatModelsService } from "./threat-models.service";

function make() {
  const models = mockRepo();
  const threats = mockRepo();
  const projects = mockRepo();
  const risks = { create: jest.fn(async () => ({ id: "risk1" })) };
  const threatAtlas = {
    isConfigured: jest.fn(() => false),
    push: jest.fn(async () => ({ configured: false, ok: false, message: "não configurado" })),
    pull: jest.fn(async () => ({ configured: false, ok: false, message: "não configurado" })),
  };
  const service = new ThreatModelsService(
    models as any,
    threats as any,
    projects as any,
    risks as any,
    threatAtlas as any,
  );
  return { service, models, threats, projects, risks, threatAtlas };
}

const model = (over: any = {}) => ({
  id: "m1",
  tenantId: "t1",
  projectId: "p1",
  name: "TM",
  status: "draft",
  dfd: { nodes: [], flows: [] },
  ...over,
});

describe("ThreatModelsService", () => {
  it("addFlow com nó inexistente → BadRequest", async () => {
    const { service, models } = make();
    models.findOne.mockResolvedValue(model({ dfd: { nodes: [{ id: "n1", type: "process", name: "API" }], flows: [] } }));
    await expect(
      service.addFlow("t1", "m1", { from: "n1", to: "naoExiste", name: "x" } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("generateThreats: STRIDE por elemento (external=2, process=6, datastore=4)", async () => {
    const { service, models, threats } = make();
    models.findOne.mockResolvedValue(
      model({
        dfd: {
          nodes: [
            { id: "n1", type: "external", name: "Cliente" },
            { id: "n2", type: "process", name: "API" },
            { id: "n3", type: "datastore", name: "DB" },
          ],
          flows: [],
        },
      }),
    );
    threats.find.mockResolvedValue([]);
    const res = await service.generateThreats("t1", "m1");
    expect(res.generated).toBe(12); // 2 + 6 + 4
    expect(threats.save).toHaveBeenCalled();
  });

  it("promoteToRisk: cria risco e vincula riskId", async () => {
    const { service, models, threats, risks } = make();
    threats.findOne.mockResolvedValue({
      id: "th1",
      tenantId: "t1",
      threatModelId: "m1",
      title: "Spoofing em API",
      category: "Spoofing",
      description: null,
      riskId: null,
    });
    models.findOne.mockResolvedValue(model());
    const res = await service.promoteToRisk("t1", "th1");
    expect(risks.create).toHaveBeenCalled();
    expect(res.riskId).toBe("risk1");
  });

  it("promoteToRisk já promovida → BadRequest", async () => {
    const { service, threats } = make();
    threats.findOne.mockResolvedValue({ id: "th1", tenantId: "t1", threatModelId: "m1", riskId: "risk0" });
    await expect(service.promoteToRisk("t1", "th1")).rejects.toBeInstanceOf(BadRequestException);
  });

  it("sync: ThreatAtlas não configurado não marca como sincronizado", async () => {
    const { service, models, threats } = make();
    const m = model();
    models.findOne.mockResolvedValue(m);
    threats.find.mockResolvedValue([]);
    const res = await service.sync("t1", "m1");
    expect(res.result.configured).toBe(false);
    expect(m.syncedAt).toBeUndefined();
  });

  it("pull sem ref do ThreatAtlas → BadRequest (publique primeiro)", async () => {
    const { service, models } = make();
    models.findOne.mockResolvedValue(model({ threatAtlasRef: null }));
    await expect(service.pull("t1", "m1")).rejects.toBeInstanceOf(BadRequestException);
  });

  it("pull aplica aprovação, versão, comentários e status das ameaças", async () => {
    const { service, models, threats, threatAtlas } = make();
    const m = model({ threatAtlasRef: "ta-1", status: "review", version: 1 });
    models.findOne.mockResolvedValue(m);
    const local = {
      id: "th1",
      tenantId: "t1",
      threatModelId: "m1",
      category: "Spoofing",
      title: "Spoofing em API",
      status: "open",
    };
    threats.find.mockResolvedValue([local]);
    threatAtlas.pull.mockResolvedValue({
      configured: true,
      ok: true,
      message: "ok",
      state: {
        status: "approved",
        version: 4,
        comments: [{ author: "Ana", body: "LGTM" }],
        threats: [
          { category: "Spoofing", title: "Spoofing em API", status: "mitigated" },
        ],
      },
    } as any);

    const res = await service.pull("t1", "m1");

    expect(m.status).toBe("approved");
    expect(m.version).toBe(4);
    expect(m.atlasComments).toHaveLength(1);
    expect(local.status).toBe("mitigated");
    expect(res.applied).toMatchObject({ status: "approved", version: 4, threatsUpdated: 1, comments: 1 });
    expect(threats.save).toHaveBeenCalledWith([local]);
  });

  it("pull com resposta não-ok não altera o modelo", async () => {
    const { service, models, threatAtlas } = make();
    const m = model({ threatAtlasRef: "ta-1", status: "draft" });
    models.findOne.mockResolvedValue(m);
    threatAtlas.pull.mockResolvedValue({ configured: true, ok: false, message: "404" } as any);
    const res = await service.pull("t1", "m1");
    expect(res.result.ok).toBe(false);
    expect(m.status).toBe("draft");
    expect(res.applied.threatsUpdated).toBe(0);
  });

  it("addNode adiciona elemento ao DFD", async () => {
    const { service, models } = make();
    const m = model();
    models.findOne.mockResolvedValue(m);
    await service.addNode("t1", "m1", { type: "process", name: "Worker" } as any);
    expect(m.dfd.nodes).toHaveLength(1);
    expect(m.dfd.nodes[0].name).toBe("Worker");
  });

  it("findOne devolve modelo + ameaças + flag de configuração", async () => {
    const { service, models, threats } = make();
    models.findOne.mockResolvedValue(model());
    threats.find.mockResolvedValue([{ id: "th1" }]);
    const res = await service.findOne("t1", "m1");
    expect(res.threats).toHaveLength(1);
    expect(res.threatAtlasConfigured).toBe(false);
  });

  it("addThreat cria ameaça manual ligada a elemento", async () => {
    const { service, models, threats } = make();
    models.findOne.mockResolvedValue(model({ dfd: { nodes: [{ id: "n1", type: "process", name: "API" }], flows: [] } }));
    threats.find.mockResolvedValue([]);
    await service.addThreat("t1", "m1", { elementId: "n1", category: "Tampering", title: "T" } as any);
    const saved = threats.save.mock.calls[0][0];
    expect(saved.elementId).toBe("n1");
    expect(saved.category).toBe("Tampering");
  });

  it("updateThreat e removeThreat", async () => {
    const { service, models, threats } = make();
    threats.findOne.mockResolvedValue({ id: "th1", tenantId: "t1", threatModelId: "m1", status: "open" });
    models.findOne.mockResolvedValue(model());
    threats.find.mockResolvedValue([]);
    await service.updateThreat("t1", "th1", { status: "mitigated" } as any);
    expect(threats.save).toHaveBeenCalled();
    const rem = await service.removeThreat("t1", "th1");
    expect(rem).toEqual({ id: "th1" });
  });

  it("removeNode remove nó, fluxos e ameaças órfãs", async () => {
    const { service, models, threats } = make();
    const m = model({
      dfd: { nodes: [{ id: "n1", type: "process", name: "API" }], flows: [{ id: "f1", from: "n1", to: "n1", name: "x" }] },
    });
    models.findOne.mockResolvedValue(m);
    threats.find.mockResolvedValue([]);
    await service.removeNode("t1", "m1", "n1");
    expect(m.dfd.nodes).toHaveLength(0);
    expect(threats.delete).toHaveBeenCalled();
  });

  it("update e remove do threat model", async () => {
    const { service, models, threats } = make();
    const m = model();
    models.findOne.mockResolvedValue(m);
    threats.find.mockResolvedValue([]);
    await service.update("t1", "m1", { name: "Novo nome" } as any);
    expect(m.name).toBe("Novo nome");
    const res = await service.remove("t1", "m1");
    expect(res).toEqual({ id: "m1" });
    expect(threats.delete).toHaveBeenCalled();
  });
});
