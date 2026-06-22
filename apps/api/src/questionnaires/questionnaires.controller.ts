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
import { TenantId } from "../common/tenant/tenant-id.decorator";
import { Roles } from "../auth/decorators";
import { Role } from "../auth/user.entity";
import { SaveQuestionnaireDto } from "./dto/save-questionnaire.dto";
import { StartQuestionnaireDto } from "./dto/start-questionnaire.dto";
import { QuestionnairesService } from "./questionnaires.service";

@ApiTags("questionnaires")
@ApiBearerAuth()
@Controller()
export class QuestionnairesController {
  constructor(private readonly service: QuestionnairesService) {}

  @Get("questionnaire-templates")
  @ApiOperation({ summary: "Catálogo de frameworks (RF-QST-001)" })
  templates() {
    return this.service.listTemplates();
  }

  @Get("questionnaire-templates/:id")
  template(@Param("id") id: string) {
    return this.service.getTemplate(id);
  }

  @Get("questionnaires")
  @ApiOperation({ summary: "Lista os questionários do tenant" })
  findAll(@TenantId() tenantId: string) {
    return this.service.findAll(tenantId);
  }

  @Get("questionnaires/:id")
  findOne(@TenantId() tenantId: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Patch("questionnaires/:id")
  @Roles(Role.Developer, Role.AppSec)
  @ApiOperation({ summary: "Salva respostas e recalcula scores (RF-QST-003)" })
  save(
    @TenantId() tenantId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: SaveQuestionnaireDto,
  ) {
    return this.service.save(tenantId, id, dto);
  }

  @Delete("questionnaires/:id")
  @Roles(Role.AppSec)
  remove(@TenantId() tenantId: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.service.remove(tenantId, id);
  }

  @Get("projects/:projectId/questionnaires")
  findForProject(
    @TenantId() tenantId: string,
    @Param("projectId", ParseUUIDPipe) projectId: string,
  ) {
    return this.service.findForProject(tenantId, projectId);
  }

  @Post("projects/:projectId/questionnaires")
  @Roles(Role.Developer, Role.AppSec)
  @ApiOperation({ summary: "Inicia um questionário a partir de um template" })
  start(
    @TenantId() tenantId: string,
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @Body() dto: StartQuestionnaireDto,
  ) {
    return this.service.start(tenantId, projectId, dto);
  }
}
