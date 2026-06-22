import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Project } from "../projects/project.entity";
import { Questionnaire } from "../questionnaires/questionnaire.entity";
import { ProjectRequirement } from "../requirements/requirement.entity";
import { Risk } from "../risks/risk.entity";
import { ThreatModel } from "../threat-modeling/threat-model.entity";
import { Threat } from "../threat-modeling/threat.entity";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      Questionnaire,
      Risk,
      ThreatModel,
      Threat,
      ProjectRequirement,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
