import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Project } from "../projects/project.entity";
import { ThreatModel } from "../threat-modeling/threat-model.entity";
import { Threat } from "../threat-modeling/threat.entity";
import {
  ProjectRequirement,
  RequirementTemplate,
} from "./requirement.entity";
import { RequirementsController } from "./requirements.controller";
import { RequirementsService } from "./requirements.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RequirementTemplate,
      ProjectRequirement,
      Project,
      Threat,
      ThreatModel,
    ]),
  ],
  controllers: [RequirementsController],
  providers: [RequirementsService],
})
export class RequirementsModule {}
