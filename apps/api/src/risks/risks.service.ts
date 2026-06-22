import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Project } from "../projects/project.entity";
import { EventBus } from "../notifications/event-bus.service";
import { AcceptRiskDto } from "./dto/accept-risk.dto";
import { CreateRiskDto } from "./dto/create-risk.dto";
import { UpdateRiskDto } from "./dto/update-risk.dto";
import { Risk, RiskStatus } from "./risk.entity";
import { riskLevel, riskScore, type RiskLevel } from "./risk-level";

// Status que ainda contam como risco "aberto" no projeto.
const OPEN_STATUSES = [RiskStatus.Open, RiskStatus.Mitigating];

export type RiskResponse = Risk & {
  level: RiskLevel;
  score: number;
  residualLevel: RiskLevel | null;
  residualScore: number | null;
  effectiveLevel: RiskLevel;
};

@Injectable()
export class RisksService {
  constructor(
    @InjectRepository(Risk)
    private readonly risks: Repository<Risk>,
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
    private readonly bus: EventBus,
  ) {}

  private toResponse(r: Risk): RiskResponse {
    const hasResidual =
      r.residualLikelihood != null && r.residualImpact != null;
    const residualLevel = hasResidual
      ? riskLevel(r.residualLikelihood!, r.residualImpact!)
      : null;
    const inherent = riskLevel(r.likelihood, r.impact);
    return {
      ...r,
      level: inherent,
      score: riskScore(r.likelihood, r.impact),
      residualLevel,
      residualScore: hasResidual
        ? riskScore(r.residualLikelihood!, r.residualImpact!)
        : null,
      effectiveLevel: residualLevel ?? inherent,
    };
  }

  async findAll(tenantId: string): Promise<RiskResponse[]> {
    const rows = await this.risks.find({
      where: { tenantId },
      order: { updatedAt: "DESC" },
    });
    return rows.map((r) => this.toResponse(r));
  }

  async findForProject(
    tenantId: string,
    projectId: string,
  ): Promise<RiskResponse[]> {
    const rows = await this.risks.find({
      where: { tenantId, projectId },
      order: { createdAt: "DESC" },
    });
    return rows.map((r) => this.toResponse(r));
  }

  async findOne(tenantId: string, id: string): Promise<RiskResponse> {
    const risk = await this.risks.findOne({ where: { tenantId, id } });
    if (!risk) throw new NotFoundException(`Risco ${id} não encontrado.`);
    return this.toResponse(risk);
  }

  async create(
    tenantId: string,
    projectId: string,
    dto: CreateRiskDto,
  ): Promise<RiskResponse> {
    await this.assertProject(tenantId, projectId);
    const risk = this.risks.create({ ...dto, tenantId, projectId });
    const saved = await this.risks.save(risk);
    await this.recomputeOpenRisks(tenantId, projectId);
    const res = this.toResponse(saved);
    if (res.effectiveLevel === "critical") {
      this.bus.emit({
        tenantId,
        event: "risk.critical",
        title: "Novo risco crítico identificado",
        fields: { Risco: saved.title, Projeto: await this.projectName(tenantId, projectId) },
      });
    }
    return res;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateRiskDto,
  ): Promise<RiskResponse> {
    const risk = await this.risks.findOne({ where: { tenantId, id } });
    if (!risk) throw new NotFoundException(`Risco ${id} não encontrado.`);

    Object.assign(risk, dto);
    // Ao registrar um plano sem status explícito, passa a "mitigando".
    if (dto.mitigationPlan && !dto.status && risk.status === RiskStatus.Open) {
      risk.status = RiskStatus.Mitigating;
    }
    const saved = await this.risks.save(risk);
    await this.recomputeOpenRisks(tenantId, risk.projectId);
    return this.toResponse(saved);
  }

  async accept(
    tenantId: string,
    id: string,
    dto: AcceptRiskDto,
  ): Promise<RiskResponse> {
    const risk = await this.risks.findOne({ where: { tenantId, id } });
    if (!risk) throw new NotFoundException(`Risco ${id} não encontrado.`);
    risk.status = RiskStatus.Accepted;
    risk.acceptedBy = dto.acceptedBy;
    risk.acceptanceJustification = dto.justification;
    risk.acceptedAt = new Date();
    const saved = await this.risks.save(risk);
    await this.recomputeOpenRisks(tenantId, risk.projectId);
    this.bus.emit({
      tenantId,
      event: "risk.accepted",
      title: "Risco aceito formalmente",
      fields: {
        Risco: saved.title,
        Projeto: await this.projectName(tenantId, saved.projectId),
        Por: dto.acceptedBy,
      },
    });
    return this.toResponse(saved);
  }

  async remove(tenantId: string, id: string): Promise<{ id: string }> {
    const risk = await this.risks.findOne({ where: { tenantId, id } });
    if (!risk) throw new NotFoundException(`Risco ${id} não encontrado.`);
    await this.risks.remove(risk);
    await this.recomputeOpenRisks(tenantId, risk.projectId);
    return { id };
  }

  /** Distribuição por nível efetivo (residual quando houver) para o dashboard. */
  async summary(tenantId: string) {
    const rows = await this.risks.find({ where: { tenantId } });
    const byLevel: Record<RiskLevel, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };
    let open = 0;
    let accepted = 0;
    for (const r of rows) {
      const res = this.toResponse(r);
      if (r.status === RiskStatus.Closed) continue;
      byLevel[res.effectiveLevel] += 1;
      if (OPEN_STATUSES.includes(r.status)) open += 1;
      if (r.status === RiskStatus.Accepted) accepted += 1;
    }
    return {
      total: rows.length,
      open,
      accepted,
      critical: byLevel.critical,
      byLevel,
    };
  }

  private async projectName(tenantId: string, projectId: string): Promise<string> {
    const p = await this.projects.findOne({ where: { tenantId, id: projectId } });
    return p?.name ?? projectId;
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

  /** Mantém Project.openRisks consistente (alimenta dashboard e cards). */
  private async recomputeOpenRisks(tenantId: string, projectId: string) {
    const count = await this.risks.count({
      where: { tenantId, projectId, status: In(OPEN_STATUSES) },
    });
    await this.projects.update({ tenantId, id: projectId }, { openRisks: count });
  }
}
