import { BadRequestException, ServiceUnavailableException } from "@nestjs/common";
import { mockRepo } from "../test-utils";
import { AiService } from "./ai.service";

function make() {
  const projects = mockRepo();
  const models = mockRepo();
  const threats = mockRepo();
  const risks = mockRepo();
  const reqs = mockRepo();
  const service = new AiService(projects as any, models as any, threats as any, risks as any, reqs as any);
  return { service, projects, models, threats, risks, reqs };
}

const review = {
  engine: "heuristic",
  dfd: {
    nodes: [
      { type: "external", name: "Cliente" },
      { type: "process", name: "API" },
    ],
    flows: [{ from: "Cliente", to: "API", name: "Req", protocol: "HTTPS" }],
  },
  threats: [{ element: "API (Processo)", category: "Spoofing", title: "Spoofing em API", description: null, mitigation: "MFA" }],
  risks: [{ title: "R1", likelihood: 3, impact: 4, category: "STRIDE: Spoofing" }],
  requirements: [{ code: "REQ-AUTH", title: "Auth", framework: "ASVS", control: "V2" }],
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe("AiService", () => {
  it("runReview repassa o resultado do agents service", async () => {
    const { service } = make();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => review }) as any;
    const res = await service.runReview({ description: "api" });
    expect(res).toEqual(review);
  });

  it("runReview: agents indisponível → ServiceUnavailable", async () => {
    const { service } = make();
    global.fetch = jest.fn().mockRejectedValue(new Error("conn refused")) as any;
    await expect(service.runReview({ description: "x" })).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it("publish: cria threat model, ameaças, riscos e requisitos (HITL)", async () => {
    const { service, projects, models, threats, risks, reqs } = make();
    projects.findOne.mockResolvedValue({ id: "p1", tenantId: "t1" });
    models.save.mockResolvedValue({ id: "m1" });
    const out = await service.publish("t1", "p1", review as any, {
      includeRisks: true,
      includeRequirements: true,
    });
    expect(out.threatModelId).toBe("m1");
    expect(out.threats).toBe(1);
    expect(out.risks).toBe(1);
    expect(out.requirements).toBe(1);
    // ameaça mapeada ao elemento do DFD pelo nome
    const savedThreats = threats.save.mock.calls[0][0];
    expect(savedThreats[0].elementId).toBeTruthy();
    expect(risks.save).toHaveBeenCalled();
    expect(reqs.save).toHaveBeenCalled();
  });

  it("publish sem DFD → BadRequest", async () => {
    const { service, projects } = make();
    projects.findOne.mockResolvedValue({ id: "p1", tenantId: "t1" });
    await expect(service.publish("t1", "p1", { threats: [] } as any, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
