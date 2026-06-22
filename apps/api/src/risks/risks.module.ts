import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Project } from "../projects/project.entity";
import { Risk } from "./risk.entity";
import { RisksController } from "./risks.controller";
import { RisksService } from "./risks.service";

@Module({
  imports: [TypeOrmModule.forFeature([Risk, Project])],
  controllers: [RisksController],
  providers: [RisksService],
  exports: [RisksService],
})
export class RisksModule {}
