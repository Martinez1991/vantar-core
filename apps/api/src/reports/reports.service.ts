import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Project } from "../projects/project.entity";
import { Questionnaire } from "../questionnaires/questionnaire.entity";
import { getTemplate } from "../questionnaires/questionnaire-catalog";
import { score } from "../questionnaires/scoring";
import {
  ProjectRequirement,
  RequirementStatus,
} from "../requirements/requirement.entity";
import { Risk, RiskStatus } from "../risks/risk.entity";
import { riskLevel, type RiskLevel } from "../risks/risk-level";
import { ThreatModel } from "../threat-modeling/threat-model.entity";
import { Threat, ThreatStatus } from "../threat-modeling/threat.entity";
import type { Stride } from "../threat-modeling/stride-catalog";

const EMPTY_LEVELS: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0, critical: 0 };

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    @InjectRepository(Questionnaire) private readonly questionnaires: Repository<Questionnaire>,
    @InjectRepository(Risk) private readonly risks: Repository<Risk>,
    @InjectRepository(ThreatModel) private readonly models: Repository<ThreatModel>,
    @InjectRepository(Threat) private readonly threats: Repository<Threat>,
    @InjectRepository(ProjectRequirement) private readonly reqs: Repository<ProjectRequirement>,
  ) {}

  async build(tenantId: string, projectId: string) {
    const project = await this.projects.findOne({ where: { tenantId, id: projectId } });
    if (!project) throw new NotFoundException("Projeto não encontrado.");

    const [qns, risks, models, requirements] = await Promise.all([
      this.questionnaires.find({ where: { tenantId, projectId } }),
      this.risks.find({ where: { tenantId, projectId } }),
      this.models.find({ where: { tenantId, projectId } }),
      this.reqs.find({ where: { tenantId, projectId } }),
    ]);

    // --- Questionários ---
    const qnItems = qns.map((q) => {
      const tpl = getTemplate(q.templateId);
      const s = tpl ? score(tpl, q.answers ?? {}) : null;
      return {
        templateName: tpl?.name ?? q.templateId,
        framework: tpl?.framework ?? "—",
        securityScore: q.securityScore,
        maturityLevel: q.maturityLevel,
        status: q.status,
        completion: s?.completion ?? 0,
      };
    });
    const avgScore = qnItems.length
      ? Math.round(qnItems.reduce((a, q) => a + q.securityScore, 0) / qnItems.length)
      : 0;

    // --- Threat modeling ---
    const threats = models.length
      ? await this.threats.find({ where: { tenantId } }).then((all) =>
          all.filter((t) => models.some((m) => m.id === t.threatModelId)),
        )
      : [];
    const byCategory: Partial<Record<Stride, number>> = {};
    for (const t of threats) byCategory[t.category] = (byCategory[t.category] ?? 0) + 1;
    const openThreats = threats.filter((t) => t.status === ThreatStatus.Open).length;

    // --- Riscos (nível efetivo) ---
    const riskItems = risks.map((r) => {
      const hasResidual = r.residualLikelihood != null && r.residualImpact != null;
      const level = hasResidual
        ? riskLevel(r.residualLikelihood!, r.residualImpact!)
        : riskLevel(r.likelihood, r.impact);
      return { title: r.title, level, status: r.status, category: r.category };
    });
    const byLevel = { ...EMPTY_LEVELS };
    let openRisks = 0;
    let acceptedRisks = 0;
    for (const r of risks) {
      const item = riskItems.find((x) => x.title === r.title);
      if (r.status === RiskStatus.Closed) continue;
      if (item) byLevel[item.level] += 1;
      if (r.status === RiskStatus.Open || r.status === RiskStatus.Mitigating) openRisks += 1;
      if (r.status === RiskStatus.Accepted) acceptedRisks += 1;
    }

    // --- Requisitos ---
    const byStatus = {
      proposed: 0,
      approved: 0,
      rejected: 0,
      implemented: 0,
    } as Record<RequirementStatus, number>;
    for (const r of requirements) byStatus[r.status] += 1;
    const reqItems = requirements.map((r) => ({
      code: r.code,
      title: r.title,
      framework: r.framework,
      control: r.control,
      status: r.status,
    }));

    // --- Resumo executivo ---
    const criticalRisks = byLevel.critical;
    const posture =
      criticalRisks > 0 || avgScore < 50
        ? "Crítico"
        : byLevel.high > 0 || avgScore < 70
          ? "Atenção"
          : "Adequado";
    const headline = this.headline(posture, criticalRisks, avgScore);
    const topRisks = riskItems
      .filter((r) => r.level === "critical" || r.level === "high")
      .slice(0, 5);

    return {
      generatedAt: new Date().toISOString(),
      project: {
        id: project.id,
        name: project.name,
        owner: project.owner,
        description: project.description,
        criticality: project.criticality,
        environment: project.environment,
        dataClasses: project.dataClasses,
        securityScore: project.securityScore,
      },
      summary: {
        posture,
        headline,
        avgScore,
        openRisks,
        criticalRisks,
        topRisks,
        pendingRequirements: byStatus.proposed,
      },
      questionnaires: { count: qnItems.length, avgScore, items: qnItems },
      threatModeling: {
        modelCount: models.length,
        totalThreats: threats.length,
        openThreats,
        byCategory,
      },
      risks: {
        total: risks.length,
        open: openRisks,
        accepted: acceptedRisks,
        byLevel,
        items: riskItems,
      },
      requirements: { total: requirements.length, byStatus, items: reqItems },
    };
  }

  private headline(posture: string, critical: number, avgScore: number): string {
    if (posture === "Crítico") {
      return critical > 0
        ? `Postura crítica: ${critical} risco(s) crítico(s) demandam ação imediata.`
        : `Postura crítica: maturidade baixa (score ${avgScore}).`;
    }
    if (posture === "Atenção") {
      return `Postura requer atenção: priorize a mitigação de riscos altos e o aumento de maturidade (score ${avgScore}).`;
    }
    return `Postura adequada: score de maturidade ${avgScore}, sem riscos críticos abertos.`;
  }
}
