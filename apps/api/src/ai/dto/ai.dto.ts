import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class RunReviewDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200000)
  openapi?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200000)
  terraform?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200000)
  k8s?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  useLlm?: boolean;
}

/**
 * Publicação HITL (RF-AI-010): o usuário revisa o review da IA e publica no
 * projeto. O `review` chega validado em estrutura no service.
 */
export class PublishReviewDto {
  @ApiPropertyOptional({ example: "Security Design Review (IA)" })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  name?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  includeRisks?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  includeRequirements?: boolean;

  @ApiProperty({ description: "Resultado do review (do POST /ai/review)" })
  @IsObject()
  review!: Record<string, unknown>;
}
