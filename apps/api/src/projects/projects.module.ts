import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Tenant } from "../tenants/tenant.entity";
import { Project } from "./project.entity";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";

@Module({
  imports: [TypeOrmModule.forFeature([Project, Tenant])],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
