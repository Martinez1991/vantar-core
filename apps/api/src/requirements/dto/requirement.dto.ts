import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateTemplateDto {
  @ApiProperty({ example: "REQ-AUTH-001" })
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  code!: string;

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

  @ApiProperty({ example: "ASVS" })
  @IsString()
  @MaxLength(40)
  framework!: string;

  @ApiProperty({ example: "V2 Authentication" })
  @IsString()
  @MaxLength(60)
  control!: string;

  @ApiPropertyOptional({ example: "Authentication" })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;
}

export class UpdateTemplateDto extends PartialType(CreateTemplateDto) {}

export class ApplyTemplateDto {
  @ApiProperty()
  @IsUUID()
  templateId!: string;
}

export class CreateProjectRequirementDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  code!: string;

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

  @ApiProperty()
  @IsString()
  @MaxLength(40)
  framework!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(60)
  control!: string;
}

export class RejectRequirementDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}
