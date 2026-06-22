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
import { AcceptRiskDto } from "./dto/accept-risk.dto";
import { CreateRiskDto } from "./dto/create-risk.dto";
import { UpdateRiskDto } from "./dto/update-risk.dto";
import { RisksService } from "./risks.service";

@ApiTags("risks")
@ApiBearerAuth()
@Controller()
export class RisksController {
  constructor(private readonly risks: RisksService) {}

  @Get("risks")
  @ApiOperation({ summary: "Lista todos os riscos do tenant" })
  findAll(@TenantId() tenantId: string) {
    return this.risks.findAll(tenantId);
  }

  @Get("risks/summary")
  @ApiOperation({ summary: "Distribuição de risco para o dashboard (RF-DSH-001)" })
  summary(@TenantId() tenantId: string) {
    return this.risks.summary(tenantId);
  }

  @Get("risks/:id")
  findOne(@TenantId() tenantId: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.risks.findOne(tenantId, id);
  }

  @Patch("risks/:id")
  @Roles(Role.Developer, Role.AppSec)
  @ApiOperation({ summary: "Atualiza risco (mitigação/residual/status) — RF-RSK-003/004" })
  update(
    @TenantId() tenantId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateRiskDto,
  ) {
    return this.risks.update(tenantId, id, dto);
  }

  @Post("risks/:id/accept")
  @Roles(Role.AppSec)
  @ApiOperation({ summary: "Aceite formal de risco — RF-RSK-005" })
  accept(
    @TenantId() tenantId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AcceptRiskDto,
  ) {
    return this.risks.accept(tenantId, id, dto);
  }

  @Delete("risks/:id")
  @Roles(Role.AppSec)
  remove(@TenantId() tenantId: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.risks.remove(tenantId, id);
  }

  @Get("projects/:projectId/risks")
  @ApiOperation({ summary: "Lista os riscos de um projeto" })
  findForProject(
    @TenantId() tenantId: string,
    @Param("projectId", ParseUUIDPipe) projectId: string,
  ) {
    return this.risks.findForProject(tenantId, projectId);
  }

  @Post("projects/:projectId/risks")
  @Roles(Role.Developer, Role.AppSec)
  @ApiOperation({ summary: "Cria um risco no projeto — RF-RSK-001/002" })
  create(
    @TenantId() tenantId: string,
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @Body() dto: CreateRiskDto,
  ) {
    return this.risks.create(tenantId, projectId, dto);
  }
}
