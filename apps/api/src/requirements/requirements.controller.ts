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
import { AuthUser } from "../auth/auth.types";
import { CurrentUser, Roles } from "../auth/decorators";
import { Role } from "../auth/user.entity";
import { TenantId } from "../common/tenant/tenant-id.decorator";
import {
  ApplyTemplateDto,
  CreateProjectRequirementDto,
  CreateTemplateDto,
  RejectRequirementDto,
  UpdateTemplateDto,
} from "./dto/requirement.dto";
import { RequirementsService } from "./requirements.service";

@ApiTags("requirements")
@ApiBearerAuth()
@Controller()
export class RequirementsController {
  constructor(private readonly service: RequirementsService) {}

  /* ---- Biblioteca ---- */
  @Get("requirement-templates")
  templates(@TenantId() t: string) {
    return this.service.listTemplates(t);
  }

  @Post("requirement-templates")
  @Roles(Role.AppSec)
  @ApiOperation({ summary: "Cria item da biblioteca (RF-REQ-001)" })
  createTemplate(@TenantId() t: string, @Body() dto: CreateTemplateDto) {
    return this.service.createTemplate(t, dto);
  }

  @Patch("requirement-templates/:id")
  @Roles(Role.AppSec)
  updateTemplate(
    @TenantId() t: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.service.updateTemplate(t, id, dto);
  }

  @Delete("requirement-templates/:id")
  @Roles(Role.AppSec)
  removeTemplate(@TenantId() t: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.service.removeTemplate(t, id);
  }

  /* ---- Requisitos de projeto ---- */
  @Get("requirements")
  all(@TenantId() t: string) {
    return this.service.listAll(t);
  }

  @Get("projects/:projectId/requirements")
  forProject(
    @TenantId() t: string,
    @Param("projectId", ParseUUIDPipe) projectId: string,
  ) {
    return this.service.listForProject(t, projectId);
  }

  @Post("projects/:projectId/requirements/apply")
  @Roles(Role.Developer, Role.AppSec)
  @ApiOperation({ summary: "Aplica um requisito da biblioteca (RF-REQ-002)" })
  apply(
    @TenantId() t: string,
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @Body() dto: ApplyTemplateDto,
  ) {
    return this.service.applyTemplate(t, projectId, dto.templateId);
  }

  @Post("projects/:projectId/requirements")
  @Roles(Role.Developer, Role.AppSec)
  createCustom(
    @TenantId() t: string,
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @Body() dto: CreateProjectRequirementDto,
  ) {
    return this.service.createCustom(t, projectId, dto);
  }

  @Post("threats/:threatId/to-requirement")
  @Roles(Role.Developer, Role.AppSec)
  @ApiOperation({ summary: "Cria requisito a partir de uma ameaça (rastreabilidade)" })
  fromThreat(
    @TenantId() t: string,
    @Param("threatId", ParseUUIDPipe) threatId: string,
  ) {
    return this.service.fromThreat(t, threatId);
  }

  /* ---- Aprovação (RF-REQ-004) ---- */
  @Post("requirements/:id/approve")
  @Roles(Role.AppSec)
  @ApiOperation({ summary: "Aprova um requisito (AppSec)" })
  approve(
    @TenantId() t: string,
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.service.approve(t, id, user.email);
  }

  @Post("requirements/:id/reject")
  @Roles(Role.AppSec)
  reject(
    @TenantId() t: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: RejectRequirementDto,
  ) {
    return this.service.reject(t, id, dto.reason);
  }

  @Post("requirements/:id/implement")
  @Roles(Role.Developer, Role.AppSec)
  implement(@TenantId() t: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.service.markImplemented(t, id);
  }

  @Delete("requirements/:id")
  @Roles(Role.Developer, Role.AppSec)
  remove(@TenantId() t: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.service.remove(t, id);
  }
}
