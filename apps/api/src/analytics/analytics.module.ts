import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Project } from "../projects/project.entity";
import { Questionnaire } from "../questionnaires/questionnaire.entity";
import { ProjectRequirement } from "../requirements/requirement.entity";
import { Risk } from "../risks/risk.entity";
import { Tenant } from "../tenants/tenant.entity";
import { Threat } from "../threat-modeling/threat.entity";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { MaturitySnapshot } from "./maturity-snapshot.entity";
import { SnapshotsService } from "./snapshots.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Risk,
      Questionnaire,
      Threat,
      Project,
      ProjectRequirement,
      Tenant,
      MaturitySnapshot,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, SnapshotsService],
})
export class AnalyticsModule {}
