import { Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Roles } from "../auth/decorators";
import { Role } from "../auth/user.entity";
import { TenantId } from "../common/tenant/tenant-id.decorator";
import { AnalyticsService } from "./analytics.service";
import { SnapshotsService } from "./snapshots.service";

@ApiTags("analytics")
@ApiBearerAuth()
@Controller("analytics")
export class AnalyticsController {
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly snapshots: SnapshotsService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Agregações dos dashboards avançados (RF-DSH-002/003/005)" })
  build(@TenantId() tenantId: string) {
    return this.analytics.build(tenantId);
  }

  @Post("snapshot")
  @Roles(Role.Developer, Role.AppSec)
  @ApiOperation({ summary: "Captura um snapshot de maturidade agora (RF-DSH-002)" })
  snapshot(@TenantId() tenantId: string) {
    return this.snapshots.capture(tenantId);
  }
}
