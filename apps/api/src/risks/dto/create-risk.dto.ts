import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateRiskDto {
  @ApiProperty({ example: "IDOR no endpoint de extrato" })
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: "Information Disclosure (STRIDE)" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  @ApiProperty({ minimum: 1, maximum: 5, description: "Probabilidade (1–5)" })
  @IsInt()
  @Min(1)
  @Max(5)
  likelihood!: number;

  @ApiProperty({ minimum: 1, maximum: 5, description: "Impacto (1–5)" })
  @IsInt()
  @Min(1)
  @Max(5)
  impact!: number;
}
