import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Roles } from "../auth/decorators";
import { Role } from "../auth/user.entity";
import { TenantId } from "../common/tenant/tenant-id.decorator";
import { AuditService } from "./audit.service";

@ApiTags("audit")
@ApiBearerAuth()
@Controller("audit")
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @Roles(Role.AppSec)
  @ApiOperation({ summary: "Trilha de auditoria do tenant (RS-AUD-001)" })
  list(@TenantId() tenantId: string) {
    return this.audit.list(tenantId);
  }
}
