import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Tenant } from "../tenants/tenant.entity";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { Criticality, Project } from "./project.entity";

const COMMUNITY_PROJECT_LIMIT = 5; // RF-PRJ-007

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
  ) {}

  findAll(tenantId: string, includeArchived = false): Promise<Project[]> {
    return this.projects.find({
      where: { tenantId, ...(includeArchived ? {} : { archived: false }) },
      order: { updatedAt: "DESC" },
    });
  }

  async findOne(tenantId: string, id: string): Promise<Project> {
    const project = await this.projects.findOne({ where: { tenantId, id } });
    if (!project) {
      throw new NotFoundException(`Projeto ${id} não encontrado neste tenant.`);
    }
    return project;
  }

  async create(tenantId: string, dto: CreateProjectDto): Promise<Project> {
    await this.enforcePlanLimit(tenantId);
    const project = this.projects.create({ ...dto, tenantId });
    return this.projects.save(project);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.findOne(tenantId, id);
    Object.assign(project, dto);
    return this.projects.save(project);
  }

  /** DELETE arquiva o projeto (soft) — RF-PRJ-001 ("arquivar"). */
  async archive(tenantId: string, id: string): Promise<Project> {
    const project = await this.findOne(tenantId, id);
    project.archived = true;
    return this.projects.save(project);
  }

  /** Resumo agregado para o dashboard (RF-DSH-001). */
  async summary(tenantId: string) {
    const items = await this.findAll(tenantId);
    const byCriticality = {
      [Criticality.Baixa]: 0,
      [Criticality.Media]: 0,
      [Criticality.Alta]: 0,
      [Criticality.Critica]: 0,
    } as Record<Criticality, number>;
    let openRisks = 0;
    let scoreSum = 0;
    for (const p of items) {
      byCriticality[p.criticality] += 1;
      openRisks += p.openRisks;
      scoreSum += p.securityScore;
    }
    return {
      totalProjects: items.length,
      projectLimit: COMMUNITY_PROJECT_LIMIT,
      openRisks,
      criticalProjects: byCriticality[Criticality.Critica],
      avgSecurityScore: items.length ? Math.round(scoreSum / items.length) : 0,
      byCriticality,
    };
  }

  private async enforcePlanLimit(tenantId: string): Promise<void> {
    const tenant = await this.tenants.findOne({ where: { id: tenantId } });
    // Enterprise (ou tenant ainda não materializado): sem limite rígido aqui.
    if (tenant && tenant.plan === "enterprise") return;

    const count = await this.projects.count({
      where: { tenantId, archived: false },
    });
    if (count >= COMMUNITY_PROJECT_LIMIT) {
      throw new ForbiddenException(
        `Limite da Community Edition atingido (${COMMUNITY_PROJECT_LIMIT} projetos). Faça upgrade para a Enterprise.`,
      );
    }
  }
}
