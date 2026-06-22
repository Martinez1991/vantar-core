import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Roles } from "../auth/decorators";
import { Role } from "../auth/user.entity";
import { TenantId } from "../common/tenant/tenant-id.decorator";
import {
  AddFlowDto,
  AddNodeDto,
  CreateThreatModelDto,
  UpdateThreatModelDto,
} from "./dto/threat-model.dto";
import { CreateThreatDto, UpdateThreatDto } from "./dto/threat.dto";
import { ThreatModelsService } from "./threat-models.service";

@ApiTags("threat-modeling")
@ApiBearerAuth()
@Controller()
export class ThreatModelsController {
  constructor(private readonly service: ThreatModelsService) {}

  @Get("threat-models")
  findAll(@TenantId() t: string) {
    return this.service.findAll(t);
  }

  @Get("threat-models/:id")
  findOne(@TenantId() t: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(t, id);
  }

  @Patch("threat-models/:id")
  @Roles(Role.Developer, Role.AppSec)
  update(
    @TenantId() t: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateThreatModelDto,
  ) {
    return this.service.update(t, id, dto);
  }

  @Delete("threat-models/:id")
  @Roles(Role.AppSec)
  remove(@TenantId() t: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.service.remove(t, id);
  }

  /* ---- DFD ---- */
  @Post("threat-models/:id/nodes")
  @Roles(Role.Developer, Role.AppSec)
  @ApiOperation({ summary: "Adiciona um elemento ao DFD (RF-TM-001)" })
  addNode(
    @TenantId() t: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AddNodeDto,
  ) {
    return this.service.addNode(t, id, dto);
  }

  @Delete("threat-models/:id/nodes/:nodeId")
  @Roles(Role.Developer, Role.AppSec)
  removeNode(
    @TenantId() t: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("nodeId", ParseUUIDPipe) nodeId: string,
  ) {
    return this.service.removeNode(t, id, nodeId);
  }

  @Post("threat-models/:id/flows")
  @Roles(Role.Developer, Role.AppSec)
  addFlow(
    @TenantId() t: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AddFlowDto,
  ) {
    return this.service.addFlow(t, id, dto);
  }

  @Delete("threat-models/:id/flows/:flowId")
  @Roles(Role.Developer, Role.AppSec)
  removeFlow(
    @TenantId() t: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("flowId", ParseUUIDPipe) flowId: string,
  ) {
    return this.service.removeFlow(t, id, flowId);
  }

  /* ---- STRIDE / ameaças ---- */
  @Post("threat-models/:id/generate-threats")
  @Roles(Role.Developer, Role.AppSec)
  @ApiOperation({ summary: "Gera ameaças candidatas STRIDE (RF-TM-002/008)" })
  generate(@TenantId() t: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.service.generateThreats(t, id);
  }

  @Post("threat-models/:id/threats")
  @Roles(Role.Developer, Role.AppSec)
  addThreat(
    @TenantId() t: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateThreatDto,
  ) {
    return this.service.addThreat(t, id, dto);
  }

  @Patch("threats/:threatId")
  @Roles(Role.Developer, Role.AppSec)
  updateThreat(
    @TenantId() t: string,
    @Param("threatId", ParseUUIDPipe) threatId: string,
    @Body() dto: UpdateThreatDto,
  ) {
    return this.service.updateThreat(t, threatId, dto);
  }

  @Delete("threats/:threatId")
  @Roles(Role.Developer, Role.AppSec)
  removeThreat(
    @TenantId() t: string,
    @Param("threatId", ParseUUIDPipe) threatId: string,
  ) {
    return this.service.removeThreat(t, threatId);
  }

  @Post("threats/:threatId/promote-to-risk")
  @Roles(Role.Developer, Role.AppSec)
  @ApiOperation({ summary: "Promove a ameaça a um risco (RF-TM-003 → RF-RSK)" })
  promote(
    @TenantId() t: string,
    @Param("threatId", ParseUUIDPipe) threatId: string,
  ) {
    return this.service.promoteToRisk(t, threatId);
  }

  /* ---- Sync ThreatAtlas ---- */
  @Post("threat-models/:id/sync")
  @Roles(Role.AppSec)
  @ApiOperation({ summary: "Publica (push) no OWASP ThreatAtlas (RF-TM-006)" })
  sync(@TenantId() t: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.service.sync(t, id);
  }

  @Post("threat-models/:id/pull")
  @Roles(Role.AppSec)
  @ApiOperation({
    summary: "Puxa (pull) aprovação/comentários/status do ThreatAtlas (RF-TM-006)",
  })
  pull(@TenantId() t: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.service.pull(t, id);
  }

  /* ---- Por projeto ---- */
  @Get("projects/:projectId/threat-models")
  findForProject(
    @TenantId() t: string,
    @Param("projectId", ParseUUIDPipe) projectId: string,
  ) {
    return this.service.findForProject(t, projectId);
  }

  @Post("projects/:projectId/threat-models")
  @Roles(Role.Developer, Role.AppSec)
  create(
    @TenantId() t: string,
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @Body() dto: CreateThreatModelDto,
  ) {
    return this.service.create(t, projectId, dto);
  }
}
