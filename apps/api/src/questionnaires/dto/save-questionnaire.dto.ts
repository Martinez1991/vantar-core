import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsObject, IsOptional } from "class-validator";
import { QuestionnaireStatus } from "../questionnaire.entity";
import type { AnswerValue } from "../scoring";

export type AnswerInput = {
  value: AnswerValue;
  justification?: string;
  evidence?: string;
};

/**
 * As respostas chegam como Record<questionId, Answer>. A validação fina
 * (valores permitidos, perguntas válidas, truncamento) é feita no service —
 * o class-validator não valida bem `Record` aninhado com forbidNonWhitelisted.
 */
export class SaveQuestionnaireDto {
  @ApiProperty({
    description: "Mapa questionId → { value: yes|partial|no|na, justification?, evidence? }",
    type: "object",
    additionalProperties: true,
  })
  @IsObject()
  answers!: Record<string, AnswerInput>;

  @ApiPropertyOptional({ enum: QuestionnaireStatus })
  @IsOptional()
  @IsEnum(QuestionnaireStatus)
  status?: QuestionnaireStatus;
}
