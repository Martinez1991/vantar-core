import { ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { RiskStatus } from "../risk.entity";
import { CreateRiskDto } from "./create-risk.dto";

export class UpdateRiskDto extends PartialType(CreateRiskDto) {
  @ApiPropertyOptional({ enum: RiskStatus })
  @IsOptional()
  @IsEnum(RiskStatus)
  status?: RiskStatus;

  // --- Mitigação (RF-RSK-003) ---
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  mitigationPlan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  mitigationOwner?: string;

  @ApiPropertyOptional({ example: "2026-09-30", description: "Prazo (YYYY-MM-DD)" })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  mitigationDueDate?: string;

  // --- Risco residual (RF-RSK-004) ---
  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  residualLikelihood?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  residualImpact?: number;
}
