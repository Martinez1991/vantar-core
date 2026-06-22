import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString } from "class-validator";
import { CATALOG } from "../questionnaire-catalog";

const TEMPLATE_IDS = CATALOG.map((t) => t.id);

export class StartQuestionnaireDto {
  @ApiProperty({ enum: TEMPLATE_IDS, example: "owasp-top10" })
  @IsString()
  @IsIn(TEMPLATE_IDS)
  templateId!: string;
}
