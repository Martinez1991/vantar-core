import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Roles } from "../auth/decorators";
import { Role } from "../auth/user.entity";
import { TenantId } from "../common/tenant/tenant-id.decorator";
import { AiService } from "./ai.service";
import { PublishReviewDto, RunReviewDto } from "./dto/ai.dto";

/**
 * AI (open core): single-agent Security Design Review with a basic prompt.
 * Async multi-agent jobs (LangGraph) are Enterprise — see EDITIONS.md.
 */
@ApiTags("ai")
@ApiBearerAuth()
@Controller("ai")
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Get("status")
  @ApiOperation({ summary: "AI Agent Plane status (single-agent)" })
  status() {
    return this.ai.status();
  }

  @Post("review")
  @Roles(Role.Developer, Role.AppSec)
  @ApiOperation({ summary: "Generate a Security Design Review (single-agent)" })
  review(@Body() dto: RunReviewDto) {
    return this.ai.runReview(dto);
  }

  @Post("projects/:projectId/publish")
  @Roles(Role.Developer, Role.AppSec)
  @ApiOperation({ summary: "Publish the review to the project (human-in-the-loop)" })
  publish(
    @TenantId() tenantId: string,
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @Body() dto: PublishReviewDto,
  ) {
    return this.ai.publish(tenantId, projectId, dto.review, {
      name: dto.name,
      includeRisks: dto.includeRisks,
      includeRequirements: dto.includeRequirements,
    });
  }
}
