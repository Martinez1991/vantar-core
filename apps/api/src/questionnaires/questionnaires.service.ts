import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Project } from "../projects/project.entity";
import { SaveQuestionnaireDto } from "./dto/save-questionnaire.dto";
import { StartQuestionnaireDto } from "./dto/start-questionnaire.dto";
import { CATALOG, getTemplate } from "./questionnaire-catalog";
import { Questionnaire, QuestionnaireStatus } from "./questionnaire.entity";
import { Answers, AnswerValue, score } from "./scoring";

const VALID_VALUES: AnswerValue[] = ["yes", "partial", "no", "na"];

@Injectable()
export class QuestionnairesService {
  constructor(
    @InjectRepository(Questionnaire)
    private readonly questionnaires: Repository<Questionnaire>,
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
  ) {}

  /** Catálogo de frameworks disponíveis (RF-QST-001). */
  listTemplates() {
    return CATALOG.map((t) => ({
      id: t.id,
      name: t.name,
      framework: t.framework,
      description: t.description,
      questionCount: t.questions.length,
    }));
  }

  getTemplate(id: string) {
    const t = getTemplate(id);
    if (!t) throw new NotFoundException(`Template ${id} não encontrado.`);
    return t;
  }

  private toResponse(qn: Questionnaire) {
    const template = getTemplate(qn.templateId);
    const scoring = template
      ? score(template, qn.answers ?? {})
      : { securityScore: 0, maturityLevel: "Inicial", riskLevel: "critical", answered: 0, total: 0, completion: 0 };
    return {
      ...qn,
      templateName: template?.name ?? qn.templateId,
      framework: template?.framework ?? "—",
      ...scoring,
    };
  }

  async findAll(tenantId: string) {
    const rows = await this.questionnaires.find({
      where: { tenantId },
      order: { updatedAt: "DESC" },
    });
    return rows.map((r) => this.toResponse(r));
  }

  async findForProject(tenantId: string, projectId: string) {
    const rows = await this.questionnaires.find({
      where: { tenantId, projectId },
      order: { createdAt: "DESC" },
    });
    return rows.map((r) => this.toResponse(r));
  }

  /** Detalhe com as perguntas do template + respostas + scoring. */
  async findOne(tenantId: string, id: string) {
    const qn = await this.questionnaires.findOne({ where: { tenantId, id } });
    if (!qn) throw new NotFoundException(`Questionário ${id} não encontrado.`);
    const template = this.getTemplate(qn.templateId);
    return { ...this.toResponse(qn), questions: template.questions };
  }

  async start(tenantId: string, projectId: string, dto: StartQuestionnaireDto) {
    await this.assertProject(tenantId, projectId);
    this.getTemplate(dto.templateId); // valida existência
    const qn = this.questionnaires.create({
      tenantId,
      projectId,
      templateId: dto.templateId,
      status: QuestionnaireStatus.Draft,
      answers: {},
    });
    const saved = await this.applyScoring(qn);
    return this.findOne(tenantId, saved.id);
  }

  async save(tenantId: string, id: string, dto: SaveQuestionnaireDto) {
    const qn = await this.questionnaires.findOne({ where: { tenantId, id } });
    if (!qn) throw new NotFoundException(`Questionário ${id} não encontrado.`);
    const template = this.getTemplate(qn.templateId);

    const allowed = new Set(template.questions.map((q) => q.id));
    const clean: Answers = {};
    for (const [qid, a] of Object.entries(dto.answers ?? {})) {
      if (!allowed.has(qid)) continue;
      if (!a || !VALID_VALUES.includes(a.value)) {
        throw new BadRequestException(`Resposta inválida para "${qid}".`);
      }
      clean[qid] = {
        value: a.value,
        justification: a.justification?.slice(0, 1000),
        evidence: a.evidence?.slice(0, 500),
      };
    }

    qn.answers = clean;
    if (dto.status) {
      qn.status = dto.status;
      qn.completedAt =
        dto.status === QuestionnaireStatus.Completed ? new Date() : null;
    }
    await this.applyScoring(qn);
    await this.deriveProjectScore(tenantId, qn.projectId);
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string) {
    const qn = await this.questionnaires.findOne({ where: { tenantId, id } });
    if (!qn) throw new NotFoundException(`Questionário ${id} não encontrado.`);
    await this.questionnaires.remove(qn);
    await this.deriveProjectScore(tenantId, qn.projectId);
    return { id };
  }

  /** Recalcula e persiste os scores do questionário. */
  private async applyScoring(qn: Questionnaire): Promise<Questionnaire> {
    const template = this.getTemplate(qn.templateId);
    const s = score(template, qn.answers ?? {});
    qn.securityScore = s.securityScore;
    qn.maturityLevel = s.maturityLevel;
    qn.riskLevel = s.riskLevel;
    return this.questionnaires.save(qn);
  }

  /**
   * Deriva Project.securityScore como média dos questionários do projeto
   * (RF-QST-003) — substitui o score manual e alimenta o dashboard.
   */
  private async deriveProjectScore(tenantId: string, projectId: string) {
    const rows = await this.questionnaires.find({
      where: { tenantId, projectId },
    });
    if (rows.length === 0) return;
    const avg = Math.round(
      rows.reduce((a, r) => a + r.securityScore, 0) / rows.length,
    );
    await this.projects.update({ tenantId, id: projectId }, { securityScore: avg });
  }

  private async assertProject(tenantId: string, projectId: string) {
    const project = await this.projects.findOne({
      where: { tenantId, id: projectId },
    });
    if (!project) {
      throw new NotFoundException(
        `Projeto ${projectId} não encontrado neste tenant.`,
      );
    }
  }
}
