import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomUUID } from "crypto";
import { In, Repository } from "typeorm";
import { Project } from "../projects/project.entity";
import {
  ProjectRequirement,
  RequirementStatus,
} from "../requirements/requirement.entity";
import { Risk, RiskStatus } from "../risks/risk.entity";
import { ThreatModel } from "../threat-modeling/threat-model.entity";
import { Threat, ThreatStatus } from "../threat-modeling/threat.entity";
import { RunReviewDto } from "./dto/ai.dto";

const AGENTS_URL = (process.env.AGENTS_URL ?? "http://localhost:8000").replace(/\/$/, "");
const OPEN_STATUSES = [RiskStatus.Open, RiskStatus.Mitigating];

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    @InjectRepository(ThreatModel) private readonly models: Repository<ThreatModel>,
    @InjectRepository(Threat) private readonly threats: Repository<Threat>,
    @InjectRepository(Risk) private readonly risks: Repository<Risk>,
    @InjectRepository(ProjectRequirement) private readonly reqs: Repository<ProjectRequirement>,
  ) {}

  async status() {
    try {
      const res = await fetch(`${AGENTS_URL}/health`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return { available: false };
      return { available: true, ...(await res.json()) };
    } catch {
      return { available: false };
    }
  }

  /** Chama o AI Agent Plane (FastAPI) e devolve o Security Design Review. */
  async runReview(dto: RunReviewDto) {
    try {
      const res = await fetch(`${AGENTS_URL}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: dto.description ?? "",
          openapi: dto.openapi ?? null,
          terraform: dto.terraform ?? null,
          k8s: dto.k8s ?? null,
          use_llm: dto.useLlm ?? true,
        }),
        signal: AbortSignal.timeout(120000),
      });
      if (!res.ok) {
        throw new ServiceUnavailableException(`AI Agent Plane respondeu ${res.status}.`);
      }
      return res.json();
    } catch (e) {
      if (e instanceof ServiceUnavailableException) throw e;
      throw new ServiceUnavailableException(
        `AI Agent Plane indisponível (${AGENTS_URL}): ${(e as Error).message}`,
      );
    }
  }

  /** Publica o review no projeto como rascunho para revisão humana (RF-AI-010). */
  async publish(
    tenantId: string,
    projectId: string,
    review: Record<string, any>,
    opts: { name?: string; includeRisks?: boolean; includeRequirements?: boolean },
  ) {
    const project = await this.projects.findOne({ where: { tenantId, id: projectId } });
    if (!project) throw new NotFoundException("Projeto não encontrado.");
    const dfd = review?.dfd;
    if (!dfd?.nodes || !Array.isArray(dfd.nodes)) {
      throw new BadRequestException("Review inválido: DFD ausente.");
    }

    // DFD → ids
    const nodeMap = new Map<string, string>();
    const nodes = dfd.nodes.map((n: any) => {
      const id = randomUUID();
      nodeMap.set(n.name, id);
      return { id, type: n.type, name: n.name };
    });
    const flows = (dfd.flows ?? [])
      .map((f: any) => ({
        id: randomUUID(),
        from: nodeMap.get(f.from) ?? "",
        to: nodeMap.get(f.to) ?? "",
        name: f.name,
        protocol: f.protocol,
      }))
      .filter((f: any) => f.from && f.to);

    const model = await this.models.save(
      this.models.create({
        tenantId,
        projectId,
        name: opts.name?.trim() || "Security Design Review (IA)",
        dfd: { nodes, flows },
      }),
    );

    // Ameaças
    const threats = (review.threats ?? []).map((t: any) => {
      const namePart = String(t.element ?? "").split(" (")[0];
      return this.threats.create({
        tenantId,
        threatModelId: model.id,
        elementId: nodeMap.get(namePart) ?? null,
        elementName: t.element ?? null,
        category: t.category,
        title: t.title,
        description: t.description ?? null,
        mitigation: t.mitigation ?? null,
        status: ThreatStatus.Open,
      });
    });
    if (threats.length) await this.threats.save(threats);

    // Riscos (opcional)
    let riskCount = 0;
    if (opts.includeRisks && Array.isArray(review.risks)) {
      const risks = review.risks.map((r: any) =>
        this.risks.create({
          tenantId,
          projectId,
          title: r.title,
          likelihood: r.likelihood,
          impact: r.impact,
          category: r.category,
          status: RiskStatus.Open,
        }),
      );
      if (risks.length) await this.risks.save(risks);
      riskCount = risks.length;
      const open = await this.risks.count({
        where: { tenantId, projectId, status: In(OPEN_STATUSES) },
      });
      await this.projects.update({ tenantId, id: projectId }, { openRisks: open });
    }

    // Requisitos (opcional)
    let reqCount = 0;
    if (opts.includeRequirements && Array.isArray(review.requirements)) {
      const reqs = review.requirements.map((rq: any) =>
        this.reqs.create({
          tenantId,
          projectId,
          code: rq.code,
          title: rq.title,
          framework: rq.framework,
          control: rq.control,
          status: RequirementStatus.Proposed,
          source: "ai",
        }),
      );
      if (reqs.length) await this.reqs.save(reqs);
      reqCount = reqs.length;
    }

    return {
      threatModelId: model.id,
      threats: threats.length,
      risks: riskCount,
      requirements: reqCount,
    };
  }
}
