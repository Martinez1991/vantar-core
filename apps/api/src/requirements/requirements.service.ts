import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Project } from "../projects/project.entity";
import { ThreatModel } from "../threat-modeling/threat-model.entity";
import { Threat } from "../threat-modeling/threat.entity";
import {
  CreateProjectRequirementDto,
  CreateTemplateDto,
  UpdateTemplateDto,
} from "./dto/requirement.dto";
import {
  ProjectRequirement,
  RequirementStatus,
  RequirementTemplate,
} from "./requirement.entity";
import { STRIDE_REQUIREMENT } from "./stride-requirement.map";

@Injectable()
export class RequirementsService {
  constructor(
    @InjectRepository(RequirementTemplate)
    private readonly templates: Repository<RequirementTemplate>,
    @InjectRepository(ProjectRequirement)
    private readonly reqs: Repository<ProjectRequirement>,
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
    @InjectRepository(Threat)
    private readonly threats: Repository<Threat>,
    @InjectRepository(ThreatModel)
    private readonly models: Repository<ThreatModel>,
  ) {}

  /* ---------------- Biblioteca (RF-REQ-001/002) ---------------- */

  listTemplates(tenantId: string) {
    return this.templates.find({ where: { tenantId }, order: { code: "ASC" } });
  }

  createTemplate(tenantId: string, dto: CreateTemplateDto) {
    return this.templates.save(this.templates.create({ ...dto, tenantId }));
  }

  async updateTemplate(tenantId: string, id: string, dto: UpdateTemplateDto) {
    const tpl = await this.templates.findOne({ where: { tenantId, id } });
    if (!tpl) throw new NotFoundException("Requisito não encontrado.");
    Object.assign(tpl, dto);
    return this.templates.save(tpl);
  }

  async removeTemplate(tenantId: string, id: string) {
    const tpl = await this.templates.findOne({ where: { tenantId, id } });
    if (!tpl) throw new NotFoundException("Requisito não encontrado.");
    await this.templates.remove(tpl);
    return { id };
  }

  /* ------------- Requisitos do projeto (RF-REQ-004) ------------- */

  listAll(tenantId: string) {
    return this.reqs.find({ where: { tenantId }, order: { updatedAt: "DESC" } });
  }

  listForProject(tenantId: string, projectId: string) {
    return this.reqs.find({
      where: { tenantId, projectId },
      order: { createdAt: "DESC" },
    });
  }

  async applyTemplate(tenantId: string, projectId: string, templateId: string) {
    await this.assertProject(tenantId, projectId);
    const tpl = await this.templates.findOne({ where: { tenantId, id: templateId } });
    if (!tpl) throw new NotFoundException("Requisito da biblioteca não encontrado.");
    return this.reqs.save(
      this.reqs.create({
        tenantId,
        projectId,
        templateId: tpl.id,
        code: tpl.code,
        title: tpl.title,
        description: tpl.description,
        framework: tpl.framework,
        control: tpl.control,
        status: RequirementStatus.Proposed,
        source: "library",
      }),
    );
  }

  async createCustom(
    tenantId: string,
    projectId: string,
    dto: CreateProjectRequirementDto,
  ) {
    await this.assertProject(tenantId, projectId);
    return this.reqs.save(
      this.reqs.create({
        tenantId,
        projectId,
        code: dto.code,
        title: dto.title,
        description: dto.description ?? null,
        framework: dto.framework,
        control: dto.control,
        status: RequirementStatus.Proposed,
        source: "custom",
      }),
    );
  }

  /** Cria requisito a partir de uma ameaça (rastreabilidade ameaça → requisito). */
  async fromThreat(tenantId: string, threatId: string) {
    const threat = await this.threats.findOne({ where: { tenantId, id: threatId } });
    if (!threat) throw new NotFoundException("Ameaça não encontrada.");
    const model = await this.models.findOne({
      where: { tenantId, id: threat.threatModelId },
    });
    if (!model) throw new NotFoundException("Threat model não encontrado.");

    const map = STRIDE_REQUIREMENT[threat.category];
    return this.reqs.save(
      this.reqs.create({
        tenantId,
        projectId: model.projectId,
        code: map.code,
        title: map.title,
        description: threat.elementName
          ? `${map.description} (origem: ${threat.title} — ${threat.elementName})`
          : map.description,
        framework: map.framework,
        control: map.control,
        status: RequirementStatus.Proposed,
        threatId: threat.id,
        source: "threat",
      }),
    );
  }

  async approve(tenantId: string, id: string, approver: string) {
    const req = await this.get(tenantId, id);
    req.status = RequirementStatus.Approved;
    req.approvedBy = approver;
    req.approvedAt = new Date();
    req.rejectionReason = null;
    return this.reqs.save(req);
  }

  async reject(tenantId: string, id: string, reason: string) {
    const req = await this.get(tenantId, id);
    req.status = RequirementStatus.Rejected;
    req.rejectionReason = reason;
    req.approvedBy = null;
    req.approvedAt = null;
    return this.reqs.save(req);
  }

  async markImplemented(tenantId: string, id: string) {
    const req = await this.get(tenantId, id);
    req.status = RequirementStatus.Implemented;
    return this.reqs.save(req);
  }

  async remove(tenantId: string, id: string) {
    const req = await this.get(tenantId, id);
    await this.reqs.remove(req);
    return { id };
  }

  /* ------------------- helpers ------------------- */

  private async get(tenantId: string, id: string): Promise<ProjectRequirement> {
    const req = await this.reqs.findOne({ where: { tenantId, id } });
    if (!req) throw new NotFoundException("Requisito não encontrado.");
    return req;
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
