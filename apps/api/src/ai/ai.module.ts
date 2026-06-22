import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Project } from "../projects/project.entity";
import { ProjectRequirement } from "../requirements/requirement.entity";
import { Risk } from "../risks/risk.entity";
import { ThreatModel } from "../threat-modeling/threat-model.entity";
import { Threat } from "../threat-modeling/threat.entity";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";

/**
 * AI Agent Plane — open core. A SINGLE agent with a BASIC prompt (synchronous
 * review + HITL publish). The multi-agent orchestration (LangGraph), complex
 * prompts and async queue-based jobs are part of Vantar Enterprise (EDITIONS.md).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ThreatModel, Threat, Risk, ProjectRequirement]),
  ],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
