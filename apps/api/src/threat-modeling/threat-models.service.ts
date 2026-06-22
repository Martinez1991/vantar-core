import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomUUID } from "crypto";
import { Repository } from "typeorm";
import { Project } from "../projects/project.entity";
import { RisksService } from "../risks/risks.service";
import {
  AddFlowDto,
  AddNodeDto,
  CreateThreatModelDto,
  UpdateThreatModelDto,
} from "./dto/threat-model.dto";
import { CreateThreatDto, UpdateThreatDto } from "./dto/threat.dto";
import {
  ELEMENT_TYPE_LABEL,
  STRIDE_BY_TYPE,
  STRIDE_MITIGATION,
} from "./stride-catalog";
import { ThreatModel, ThreatModelStatus } from "./threat-model.entity";
import { Threat, ThreatStatus } from "./threat.entity";
import { ThreatAtlasSyncService } from "./threatatlas-sync.service";

// Mapeamento do estado colaborativo do ThreatAtlas para os enums locais.
const ATLAS_MODEL_STATUS: Record<string, ThreatModelStatus> = {
  approved: ThreatModelStatus.Approved,
  review: ThreatModelStatus.Review,
  draft: ThreatModelStatus.Draft,
};
const ATLAS_THREAT_STATUS: Record<string, ThreatStatus> = {
  open: ThreatStatus.Open,
  mitigated: ThreatStatus.Mitigated,
  accepted: ThreatStatus.Accepted,
};

const threatKey = (category: string, title: string) =>
  `${category}|${title}`.toLowerCase();

@Injectable()
export class ThreatModelsService {
  constructor(
    @InjectRepository(ThreatModel)
    private readonly models: Repository<ThreatModel>,
    @InjectRepository(Threat)
    private readonly threats: Repository<Threat>,
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
    private readonly risks: RisksService,
    private readonly threatAtlas: ThreatAtlasSyncService,
  ) {}

  async findAll(tenantId: string) {
    const rows = await this.models.find({
      where: { tenantId },
      order: { updatedAt: "DESC" },
    });
    return Promise.all(rows.map((m) => this.withCounts(m)));
  }

  async findForProject(tenantId: string, projectId: string) {
    const rows = await this.models.find({
      where: { tenantId, projectId },
      order: { createdAt: "DESC" },
    });
    return Promise.all(rows.map((m) => this.withCounts(m)));
  }

  async findOne(tenantId: string, id: string) {
    const model = await this.get(tenantId, id);
    const threats = await this.threats.find({
      where: { tenantId, threatModelId: id },
      order: { createdAt: "ASC" },
    });
    return {
      ...model,
      threats,
      threatAtlasConfigured: this.threatAtlas.isConfigured(),
    };
  }

  async create(tenantId: string, projectId: string, dto: CreateThreatModelDto) {
    await this.assertProject(tenantId, projectId);
    const model = await this.models.save(
      this.models.create({
        tenantId,
        projectId,
        name: dto.name,
        dfd: { nodes: [], flows: [] },
      }),
    );
    return this.findOne(tenantId, model.id);
  }

  async update(tenantId: string, id: string, dto: UpdateThreatModelDto) {
    const model = await this.get(tenantId, id);
    Object.assign(model, dto);
    await this.models.save(model);
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string) {
    const model = await this.get(tenantId, id);
    await this.threats.delete({ tenantId, threatModelId: id });
    await this.models.remove(model);
    return { id };
  }

  /* ---------------- DFD (RF-TM-001) ---------------- */

  async addNode(tenantId: string, id: string, dto: AddNodeDto) {
    const model = await this.get(tenantId, id);
    model.dfd.nodes.push({ id: randomUUID(), type: dto.type, name: dto.name });
    await this.models.save(model);
    return this.findOne(tenantId, id);
  }

  async removeNode(tenantId: string, id: string, nodeId: string) {
    const model = await this.get(tenantId, id);
    model.dfd.nodes = model.dfd.nodes.filter((n) => n.id !== nodeId);
    model.dfd.flows = model.dfd.flows.filter(
      (f) => f.from !== nodeId && f.to !== nodeId,
    );
    await this.models.save(model);
    // Remove ameaças órfãs daquele elemento.
    await this.threats.delete({ tenantId, threatModelId: id, elementId: nodeId });
    return this.findOne(tenantId, id);
  }

  async addFlow(tenantId: string, id: string, dto: AddFlowDto) {
    const model = await this.get(tenantId, id);
    const ids = new Set(model.dfd.nodes.map((n) => n.id));
    if (!ids.has(dto.from) || !ids.has(dto.to)) {
      throw new BadRequestException("Fluxo referencia elemento inexistente.");
    }
    model.dfd.flows.push({
      id: randomUUID(),
      from: dto.from,
      to: dto.to,
      name: dto.name,
      protocol: dto.protocol,
    });
    await this.models.save(model);
    return this.findOne(tenantId, id);
  }

  async removeFlow(tenantId: string, id: string, flowId: string) {
    const model = await this.get(tenantId, id);
    model.dfd.flows = model.dfd.flows.filter((f) => f.id !== flowId);
    await this.models.save(model);
    return this.findOne(tenantId, id);
  }

  /* ------------- STRIDE (RF-TM-002/008) ------------- */

  /** Gera ameaças candidatas STRIDE por elemento, sem duplicar. */
  async generateThreats(tenantId: string, id: string) {
    const model = await this.get(tenantId, id);
    const existing = await this.threats.find({
      where: { tenantId, threatModelId: id },
    });
    const seen = new Set(existing.map((t) => `${t.elementId}:${t.category}`));

    const toCreate: Threat[] = [];
    for (const node of model.dfd.nodes) {
      for (const category of STRIDE_BY_TYPE[node.type]) {
        const key = `${node.id}:${category}`;
        if (seen.has(key)) continue;
        seen.add(key);
        toCreate.push(
          this.threats.create({
            tenantId,
            threatModelId: id,
            elementId: node.id,
            elementName: `${node.name} (${ELEMENT_TYPE_LABEL[node.type]})`,
            category,
            title: `${category} em ${node.name}`,
            mitigation: STRIDE_MITIGATION[category],
            status: ThreatStatus.Open,
          }),
        );
      }
    }
    if (toCreate.length) await this.threats.save(toCreate);
    return { generated: toCreate.length, ...(await this.findOne(tenantId, id)) };
  }

  async addThreat(tenantId: string, id: string, dto: CreateThreatDto) {
    const model = await this.get(tenantId, id);
    const node = dto.elementId
      ? model.dfd.nodes.find((n) => n.id === dto.elementId)
      : undefined;
    await this.threats.save(
      this.threats.create({
        tenantId,
        threatModelId: id,
        elementId: node?.id ?? null,
        elementName: node
          ? `${node.name} (${ELEMENT_TYPE_LABEL[node.type]})`
          : null,
        category: dto.category,
        title: dto.title,
        description: dto.description ?? null,
        mitigation: dto.mitigation ?? null,
        status: ThreatStatus.Open,
      }),
    );
    return this.findOne(tenantId, id);
  }

  async updateThreat(tenantId: string, threatId: string, dto: UpdateThreatDto) {
    const threat = await this.getThreat(tenantId, threatId);
    Object.assign(threat, dto);
    await this.threats.save(threat);
    return this.findOne(tenantId, threat.threatModelId);
  }

  async removeThreat(tenantId: string, threatId: string) {
    const threat = await this.getThreat(tenantId, threatId);
    await this.threats.remove(threat);
    return { id: threatId };
  }

  /** Promove uma ameaça a um Risco no Risk Assessment (RF-TM-003 → RF-RSK). */
  async promoteToRisk(tenantId: string, threatId: string) {
    const threat = await this.getThreat(tenantId, threatId);
    if (threat.riskId) {
      throw new BadRequestException("Ameaça já promovida a risco.");
    }
    const model = await this.get(tenantId, threat.threatModelId);
    const risk = await this.risks.create(tenantId, model.projectId, {
      title: threat.title,
      description: threat.description ?? undefined,
      category: `STRIDE: ${threat.category}`,
      likelihood: 3,
      impact: 3,
    });
    threat.riskId = risk.id;
    await this.threats.save(threat);
    return { threat, riskId: risk.id };
  }

  /* ------------- Sync ThreatAtlas (RF-TM-006) ------------- */

  async sync(tenantId: string, id: string) {
    const model = await this.get(tenantId, id);
    const threats = await this.threats.find({
      where: { tenantId, threatModelId: id },
    });
    const result = await this.threatAtlas.push(model, threats);
    if (result.ok) {
      model.threatAtlasRef = result.ref ?? null;
      model.syncedAt = new Date();
      await this.models.save(model);
    }
    return { result, model: await this.withCounts(model) };
  }

  /**
   * Pull (RF-TM-006, bidirecional): lê de volta do ThreatAtlas a aprovação,
   * a versão, os status das ameaças e os comentários, aplicando no modelo
   * local. O ThreatAtlas é o system-of-record do estado colaborativo.
   */
  async pull(tenantId: string, id: string) {
    const model = await this.get(tenantId, id);
    if (!model.threatAtlasRef) {
      throw new BadRequestException(
        "Modelo ainda não publicado no ThreatAtlas — faça o push (Sincronizar) primeiro.",
      );
    }

    const result = await this.threatAtlas.pull(model.threatAtlasRef);
    const applied = {
      status: null as ThreatModelStatus | null,
      version: null as number | null,
      threatsUpdated: 0,
      comments: 0,
    };

    if (result.ok && result.state) {
      const state = result.state;

      const mappedStatus = state.status
        ? ATLAS_MODEL_STATUS[state.status.toLowerCase()]
        : undefined;
      if (mappedStatus) {
        model.status = mappedStatus;
        applied.status = mappedStatus;
      }
      if (typeof state.version === "number") {
        model.version = state.version;
        applied.version = state.version;
      }
      if (Array.isArray(state.comments)) {
        model.atlasComments = state.comments;
        applied.comments = state.comments.length;
      }
      if (Array.isArray(state.threats) && state.threats.length) {
        applied.threatsUpdated = await this.applyThreatStates(
          tenantId,
          id,
          state.threats,
        );
      }

      model.syncedAt = new Date();
      await this.models.save(model);
    }

    return { result, applied, model: await this.withCounts(model) };
  }

  /** Casa as ameaças remotas (categoria+título) e atualiza o status local. */
  private async applyThreatStates(
    tenantId: string,
    threatModelId: string,
    remote: { category?: string; title?: string; status?: string }[],
  ): Promise<number> {
    const locals = await this.threats.find({
      where: { tenantId, threatModelId },
    });
    const byKey = new Map(locals.map((t) => [threatKey(t.category, t.title), t]));
    const changed: Threat[] = [];
    for (const r of remote) {
      if (!r.category || !r.title || !r.status) continue;
      const mapped = ATLAS_THREAT_STATUS[r.status.toLowerCase()];
      const local = byKey.get(threatKey(r.category, r.title));
      if (mapped && local && local.status !== mapped) {
        local.status = mapped;
        changed.push(local);
      }
    }
    if (changed.length) await this.threats.save(changed);
    return changed.length;
  }

  /* ------------------- helpers ------------------- */

  private async withCounts(model: ThreatModel) {
    const [threatCount, openThreatCount] = await Promise.all([
      this.threats.count({ where: { tenantId: model.tenantId, threatModelId: model.id } }),
      this.threats.count({
        where: {
          tenantId: model.tenantId,
          threatModelId: model.id,
          status: ThreatStatus.Open,
        },
      }),
    ]);
    return {
      ...model,
      nodeCount: model.dfd.nodes.length,
      flowCount: model.dfd.flows.length,
      threatCount,
      openThreatCount,
    };
  }

  private async get(tenantId: string, id: string): Promise<ThreatModel> {
    const model = await this.models.findOne({ where: { tenantId, id } });
    if (!model) throw new NotFoundException(`Threat model ${id} não encontrado.`);
    return model;
  }

  private async getThreat(tenantId: string, id: string): Promise<Threat> {
    const threat = await this.threats.findOne({ where: { tenantId, id } });
    if (!threat) throw new NotFoundException(`Ameaça ${id} não encontrada.`);
    return threat;
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
