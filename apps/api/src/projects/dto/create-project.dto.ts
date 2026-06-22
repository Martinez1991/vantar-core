import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { Criticality, Environment } from "../project.entity";

export class CreateProjectDto {
  @ApiProperty({ example: "PagFlow — Gateway de Pagamentos" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: "Equipe Payments" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  owner!: string;

  @ApiProperty({ enum: Criticality, default: Criticality.Media })
  @IsEnum(Criticality)
  criticality!: Criticality;

  @ApiProperty({ enum: Environment, default: Environment.Cloud })
  @IsEnum(Environment)
  environment!: Environment;

  @ApiPropertyOptional({ type: [String], example: ["PCI", "PII"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  dataClasses?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  tags?: string[];

  @ApiPropertyOptional({ minimum: 0, maximum: 100, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  securityScore?: number;
}
