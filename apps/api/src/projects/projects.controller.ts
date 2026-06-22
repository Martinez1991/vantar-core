import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { TenantId } from "../common/tenant/tenant-id.decorator";
import { Roles } from "../auth/decorators";
import { Role } from "../auth/user.entity";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { ProjectsService } from "./projects.service";

@ApiTags("projects")
@ApiBearerAuth()
@Controller("projects")
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: "Lista os projetos do tenant" })
  findAll(
    @TenantId() tenantId: string,
    @Query("includeArchived") includeArchived?: string,
  ) {
    return this.projects.findAll(tenantId, includeArchived === "true");
  }

  @Get("summary")
  @ApiOperation({ summary: "Resumo agregado para o dashboard (RF-DSH-001)" })
  summary(@TenantId() tenantId: string) {
    return this.projects.summary(tenantId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalha um projeto" })
  findOne(
    @TenantId() tenantId: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.projects.findOne(tenantId, id);
  }

  @Post()
  @Roles(Role.Developer, Role.AppSec)
  @ApiOperation({ summary: "Cria um projeto (valida limite CE — RF-PRJ-007)" })
  create(@TenantId() tenantId: string, @Body() dto: CreateProjectDto) {
    return this.projects.create(tenantId, dto);
  }

  @Patch(":id")
  @Roles(Role.Developer, Role.AppSec)
  @ApiOperation({ summary: "Edita um projeto" })
  update(
    @TenantId() tenantId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects.update(tenantId, id, dto);
  }

  @Delete(":id")
  @Roles(Role.AppSec)
  @HttpCode(200)
  @ApiOperation({ summary: "Arquiva um projeto (soft delete)" })
  archive(
    @TenantId() tenantId: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.projects.archive(tenantId, id);
  }
}
