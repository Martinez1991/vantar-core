import { BadRequestException, NotFoundException } from "@nestjs/common";
import { mockRepo } from "../test-utils";
import { QuestionnairesService } from "./questionnaires.service";
import { QuestionnaireStatus } from "./questionnaire.entity";

function make() {
  const questionnaires = mockRepo();
  const projects = mockRepo();
  const service = new QuestionnairesService(questionnaires as any, projects as any);
  return { service, questionnaires, projects };
}

describe("QuestionnairesService", () => {
  it("listTemplates retorna o catálogo com contagem", () => {
    const { service } = make();
    const tpls = service.listTemplates();
    expect(tpls.length).toBeGreaterThanOrEqual(4);
    expect(tpls[0]).toHaveProperty("questionCount");
  });

  it("getTemplate inválido → NotFound", () => {
    const { service } = make();
    expect(() => service.getTemplate("inexistente")).toThrow(NotFoundException);
  });

  it("start: valida projeto e cria rascunho com score 0", async () => {
    const { service, projects, questionnaires } = make();
    projects.findOne.mockResolvedValue({ id: "p1", tenantId: "t1" });
    const qn = { id: "q1", tenantId: "t1", projectId: "p1", templateId: "nist-csf", answers: {}, status: "draft" };
    questionnaires.findOne.mockResolvedValue(qn);
    const res = await service.start("t1", "p1", { templateId: "nist-csf" });
    expect(res.securityScore).toBe(0);
    expect(res.questions.length).toBeGreaterThan(0);
  });

  it("save: calcula score, deriva o do projeto e respeita 'na'", async () => {
    const { service, questionnaires, projects } = make();
    const qn: any = { id: "q1", tenantId: "t1", projectId: "p1", templateId: "nist-csf", answers: {}, status: "draft" };
    questionnaires.findOne.mockResolvedValue(qn);
    questionnaires.find.mockResolvedValue([{ securityScore: 80 }, { securityScore: 60 }]);
    const ids = service.getTemplate("nist-csf").questions.map((q) => q.id);
    const answers: any = { [ids[0]]: { value: "yes" }, [ids[1]]: { value: "na" } };
    const res = await service.save("t1", "q1", { answers, status: QuestionnaireStatus.Completed });
    expect(res.securityScore).toBe(100); // 1 aplicável 'yes', 'na' excluído
    expect(res.completedAt).toBeInstanceOf(Date);
    expect(projects.update).toHaveBeenCalledWith(
      { tenantId: "t1", id: "p1" },
      { securityScore: 70 },
    );
  });

  it("save: valor de resposta inválido → BadRequest", async () => {
    const { service, questionnaires } = make();
    const qn: any = { id: "q1", tenantId: "t1", projectId: "p1", templateId: "nist-csf", answers: {} };
    questionnaires.findOne.mockResolvedValue(qn);
    const ids = service.getTemplate("nist-csf").questions.map((q) => q.id);
    await expect(
      service.save("t1", "q1", { answers: { [ids[0]]: { value: "talvez" } } as any }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("findOne inexistente → NotFound", async () => {
    const { service, questionnaires } = make();
    questionnaires.findOne.mockResolvedValue(null);
    await expect(service.findOne("t1", "x")).rejects.toBeInstanceOf(NotFoundException);
  });
});
