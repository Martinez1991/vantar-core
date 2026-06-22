import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Project } from "../projects/project.entity";
import { Questionnaire } from "./questionnaire.entity";
import { QuestionnairesController } from "./questionnaires.controller";
import { QuestionnairesService } from "./questionnaires.service";

@Module({
  imports: [TypeOrmModule.forFeature([Questionnaire, Project])],
  controllers: [QuestionnairesController],
  providers: [QuestionnairesService],
})
export class QuestionnairesModule {}
