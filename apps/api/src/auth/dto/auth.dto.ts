import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from "class-validator";
import { Role } from "../user.entity";

export class RegisterDto {
  @ApiProperty({ example: "Acme Security" })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  tenantName!: string;

  @ApiProperty({ example: "Rafael Martinez" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: "rafael@acme.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;
}

export class LoginDto {
  @ApiProperty({ example: "rafael@acme.com" })
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  password!: string;

  @ApiPropertyOptional({ description: "Código TOTP (quando MFA está ativo)" })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  code?: string;
}

export class CreateUserDto {
  @ApiProperty({ example: "Ana Costa" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;

  @ApiProperty({ enum: Role, example: Role.Developer })
  @IsEnum(Role)
  role!: Role;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  @MinLength(20)
  refreshToken!: string;
}

export class MfaCodeDto {
  @ApiProperty({ example: "123456" })
  @IsString()
  @Length(6, 6)
  code!: string;
}
