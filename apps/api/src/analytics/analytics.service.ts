import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Project } from "../projects/project.entity";
import { Questionnaire } from "../questionnaires/questionnaire.entity";
import { getTemplate } from "../questionnaires/questionnaire-catalog";
import { Risk, RiskStatus } from "../risks/risk.entity";
import { riskLevel, riskScore } from "../risks/risk-level";
import { Threat } from "../threat-modeling/threat.entity";
import { SnapshotsService } from "./snapshots.service";

/**
 * Agregações para os dashboards avançados (RF-DSH-002/003/005). Tudo derivado
 * dos dados existentes — sem snapshots dedicados: a "evolução" usa os
 * questionários concluídos como pontos no tempo (honesto).
 */
@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Risk) private readonly risks: Repository<Risk>,
    @InjectRepository(Questionnaire)
    private readonly questionnaires: Repository<Questionnaire>,
    @InjectRepository(Threat) private readonly threats: Repository<Threat>,
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    private readonly snapshotsService: SnapshotsService,
  ) {}

  async build(tenantId: string) {
    const [risks, questionnaires, threats, projects] = await Promise.all([
      this.risks.find({ where: { tenantId } }),
      this.questionnaires.find({ where: { tenantId } }),
      this.threats.find({ where: { tenantId } }),
      this.projects.find({ where: { tenantId } }),
    ]);
    const projectName = (id: string) =>
      projects.find((p) => p.id === id)?.name ?? "—";

    // --- Heatmap P×I (RF-DSH-005): matrix[impact-1][likelihood-1] ---
    const heatmap = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => 0));
    const active = risks.filter((r) => r.status !== RiskStatus.Closed);
    for (const r of active) heatmap[r.impact - 1][r.likelihood - 1] += 1;

    // --- Riscos por status (RF-DSH-003) ---
    const byStatus = { open: 0, mitigating: 0, accepted: 0, closed: 0 };
    for (const r of risks) byStatus[r.status] += 1;
    const treated = byStatus.mitigating + byStatus.accepted + byStatus.closed;

    // --- Compliance score por framework (RF-DSH-003) ---
    const fw = new Map<string, { sum: number; count: number }>();
    for (const q of questionnaires) {
      const framework = getTemplate(q.templateId)?.framework ?? q.templateId;
      const acc = fw.get(framework) ?? { sum: 0, count: 0 };
      acc.sum += q.securityScore;
      acc.count += 1;
      fw.set(framework, acc);
    }
    const complianceByFramework = [...fw.entries()]
      .map(([framework, { sum, count }]) => ({
        framework,
        score: Math.round(sum / count),
        count,
      }))
      .sort((a, b) => b.score - a.score);

    // --- Distribuição de maturidade ---
    const maturityDistribution: Record<string, number> = {
      Inicial: 0,
      "Básico": 0,
      "Intermediário": 0,
      "Avançado": 0,
    };
    for (const q of questionnaires) {
      if (q.maturityLevel in maturityDistribution) {
        maturityDistribution[q.maturityLevel] += 1;
      }
    }

    // --- Ameaças por categoria STRIDE ---
    const threatsByCategory: Record<string, number> = {};
    for (const t of threats) {
      threatsByCategory[t.category] = (threatsByCategory[t.category] ?? 0) + 1;
    }

    // --- Evolução de maturidade (RF-DSH-002): série temporal de snapshots ---
    const snapshots = await this.snapshotsService.list(tenantId);
    const maturityTimeline = snapshots.map((s) => ({
      date: s.capturedAt,
      score: s.avgSecurityScore,
      openRisks: s.openRisks,
      criticalRisks: s.criticalRisks,
    }));

    // --- Top riscos por score inerente ---
    const topRisks = [...active]
      .map((r) => ({
        title: r.title,
        project: projectName(r.projectId),
        level: riskLevel(r.likelihood, r.impact),
        score: riskScore(r.likelihood, r.impact),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return {
      riskHeatmap: { matrix: heatmap, total: active.length },
      riskByStatus: { ...byStatus, treated },
      complianceByFramework,
      maturityDistribution,
      threatsByCategory,
      maturityTimeline,
      topRisks,
    };
  }
}
