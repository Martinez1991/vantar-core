import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

/** Aceite formal de risco — RF-RSK-005. */
export class AcceptRiskDto {
  @ApiProperty({ example: "Maria Souza (CISO)" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  acceptedBy!: string;

  @ApiProperty({ example: "Risco residual baixo; custo de mitigação acima do benefício neste ciclo." })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  justification!: string;
}
