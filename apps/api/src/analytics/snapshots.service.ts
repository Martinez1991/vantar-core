import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { runInTransaction } from "typeorm-transactional";
import { Project } from "../projects/project.entity";
import {
  ProjectRequirement,
  RequirementStatus,
} from "../requirements/requirement.entity";
import { Risk, RiskStatus } from "../risks/risk.entity";
import { riskLevel } from "../risks/risk-level";
import { Tenant } from "../tenants/tenant.entity";
import { MaturitySnapshot } from "./maturity-snapshot.entity";

const OPEN = [RiskStatus.Open, RiskStatus.Mitigating];

@Injectable()
export class SnapshotsService {
  private readonly logger = new Logger(SnapshotsService.name);

  constructor(
    @InjectRepository(MaturitySnapshot)
    private readonly snapshots: Repository<MaturitySnapshot>,
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    @InjectRepository(Risk) private readonly risks: Repository<Risk>,
    @InjectRepository(ProjectRequirement)
    private readonly reqs: Repository<ProjectRequirement>,
    @InjectRepository(Tenant) private readonly tenants: Repository<Tenant>,
  ) {}

  list(tenantId: string) {
    return this.snapshots.find({
      where: { tenantId },
      order: { capturedAt: "ASC" },
    });
  }

  /** Captura (upsert) o snapshot de hoje do tenant. Assume o GUC já setado. */
  async capture(tenantId: string): Promise<MaturitySnapshot> {
    const today = new Date().toISOString().slice(0, 10);
    const [projects, risks, reqs] = await Promise.all([
      this.projects.find({ where: { tenantId, archived: false } }),
      this.risks.find({ where: { tenantId } }),
      this.reqs.find({ where: { tenantId } }),
    ]);

    const avgSecurityScore = projects.length
      ? Math.round(projects.reduce((a, p) => a + p.securityScore, 0) / projects.length)
      : 0;
    const openRisks = risks.filter((r) => OPEN.includes(r.status)).length;
    const criticalRisks = risks.filter((r) => {
      if (r.status === RiskStatus.Closed) return false;
      const lvl = riskLevel(
        r.residualLikelihood ?? r.likelihood,
        r.residualImpact ?? r.impact,
      );
      return lvl === "critical";
    }).length;
    const requirementsApproved = reqs.filter(
      (r) => r.status === RequirementStatus.Approved || r.status === RequirementStatus.Implemented,
    ).length;

    const metrics = {
      avgSecurityScore,
      projectCount: projects.length,
      openRisks,
      criticalRisks,
      requirementsApproved,
      requirementsTotal: reqs.length,
    };

    const existing = await this.snapshots.findOne({
      where: { tenantId, capturedAt: today },
    });
    if (existing) {
      Object.assign(existing, metrics);
      return this.snapshots.save(existing);
    }
    return this.snapshots.save(
      this.snapshots.create({ tenantId, capturedAt: today, ...metrics }),
    );
  }

  /** Cron diário: captura o snapshot de cada tenant (com o GUC correto). */
  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: "maturity-snapshots" })
  async captureAll(): Promise<void> {
    const tenants = await this.tenants.find();
    for (const tenant of tenants) {
      try {
        await runInTransaction(async () => {
          await this.snapshots.query(
            "SELECT set_config('app.current_tenant', $1, true)",
            [tenant.id],
          );
          await this.capture(tenant.id);
        });
      } catch (e) {
        this.logger.warn(`Falha no snapshot do tenant ${tenant.id}: ${(e as Error).message}`);
      }
    }
    this.logger.log(`Snapshots de maturidade capturados (${tenants.length} tenant(s)).`);
  }
}
