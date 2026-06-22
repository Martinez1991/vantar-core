import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { ElementType } from "../stride-catalog";
import { ThreatModelStatus } from "../threat-model.entity";

const ELEMENT_TYPES: ElementType[] = ["external", "process", "datastore", "boundary"];

export class CreateThreatModelDto {
  @ApiProperty({ example: "Threat Model — Fluxo de pagamento" })
  @IsString()
  @MinLength(2)
  @MaxLength(140)
  name!: string;
}

export class UpdateThreatModelDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(140)
  name?: string;

  @ApiPropertyOptional({ enum: ThreatModelStatus })
  @IsOptional()
  @IsEnum(ThreatModelStatus)
  status?: ThreatModelStatus;
}

export class AddNodeDto {
  @ApiProperty({ enum: ELEMENT_TYPES })
  @IsIn(ELEMENT_TYPES)
  type!: ElementType;

  @ApiProperty({ example: "API de Pagamentos" })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;
}

export class AddFlowDto {
  @ApiProperty({ description: "id do nó de origem" })
  @IsString()
  from!: string;

  @ApiProperty({ description: "id do nó de destino" })
  @IsString()
  to!: string;

  @ApiProperty({ example: "Requisição de cobrança" })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional({ example: "HTTPS" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  protocol?: string;
}
