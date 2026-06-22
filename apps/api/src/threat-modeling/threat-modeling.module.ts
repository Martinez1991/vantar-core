import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Project } from "../projects/project.entity";
import { RisksModule } from "../risks/risks.module";
import { ThreatModelsController } from "./threat-models.controller";
import { ThreatModelsService } from "./threat-models.service";
import { ThreatModel } from "./threat-model.entity";
import { Threat } from "./threat.entity";
import { ThreatAtlasSyncService } from "./threatatlas-sync.service";

@Module({
  imports: [TypeOrmModule.forFeature([ThreatModel, Threat, Project]), RisksModule],
  controllers: [ThreatModelsController],
  providers: [ThreatModelsService, ThreatAtlasSyncService],
})
export class ThreatModelingModule {}
