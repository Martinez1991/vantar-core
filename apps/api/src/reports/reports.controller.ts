import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { TenantId } from "../common/tenant/tenant-id.decorator";
import { ReportsService } from "./reports.service";

@ApiTags("reports")
@ApiBearerAuth()
@Controller()
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get("projects/:projectId/report")
  @ApiOperation({ summary: "Relatório consolidado do projeto (RF-REP-001/002)" })
  build(
    @TenantId() tenantId: string,
    @Param("projectId", ParseUUIDPipe) projectId: string,
  ) {
    return this.reports.build(tenantId, projectId);
  }
}
