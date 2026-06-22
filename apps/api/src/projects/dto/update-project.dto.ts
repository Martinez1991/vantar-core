import { PartialType } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, Max, Min } from "class-validator";
import { CreateProjectDto } from "./create-project.dto";

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @IsOptional()
  @IsBoolean()
  archived?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  openRisks?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  securityScore?: number;
}
