import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { Stride } from "../stride-catalog";
import { ThreatStatus } from "../threat.entity";

const STRIDE_VALUES: Stride[] = [
  "Spoofing",
  "Tampering",
  "Repudiation",
  "Information Disclosure",
  "Denial of Service",
  "Elevation of Privilege",
];

export class CreateThreatDto {
  @ApiPropertyOptional({ description: "id do elemento do DFD" })
  @IsOptional()
  @IsString()
  elementId?: string;

  @ApiProperty({ enum: STRIDE_VALUES })
  @IsIn(STRIDE_VALUES)
  category!: Stride;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  mitigation?: string;
}

export class UpdateThreatDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  mitigation?: string;

  @ApiPropertyOptional({ enum: ThreatStatus })
  @IsOptional()
  @IsEnum(ThreatStatus)
  status?: ThreatStatus;
}
