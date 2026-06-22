import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthUser } from "./auth.types";
import { AuthService } from "./auth.service";
import { CurrentUser, Public, Roles } from "./decorators";
import {
  CreateUserDto,
  LoginDto,
  MfaCodeDto,
  RefreshDto,
  RegisterDto,
} from "./dto/auth.dto";
import { Role } from "./user.entity";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Cria um tenant e seu usuário owner" })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post("login")
  @ApiOperation({ summary: "Autentica (RS256) e retorna access + refresh token" })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Post("refresh")
  @ApiOperation({ summary: "Rotaciona o refresh token e emite novo access token" })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Public()
  @Post("logout")
  @ApiOperation({ summary: "Revoga o refresh token" })
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @Get("me")
  @ApiOperation({ summary: "Perfil do usuário autenticado" })
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user);
  }

  /* ---- MFA ---- */
  @Post("mfa/setup")
  @ApiOperation({ summary: "Gera o segredo TOTP (RS-IAM-003)" })
  mfaSetup(@CurrentUser() user: AuthUser) {
    return this.auth.mfaSetup(user.userId);
  }

  @Post("mfa/enable")
  @ApiOperation({ summary: "Ativa o MFA verificando um código" })
  mfaEnable(@CurrentUser() user: AuthUser, @Body() dto: MfaCodeDto) {
    return this.auth.mfaEnable(user.userId, dto.code);
  }

  @Post("mfa/disable")
  mfaDisable(@CurrentUser() user: AuthUser) {
    return this.auth.mfaDisable(user.userId);
  }

  /* ---- Gestão de usuários (admin) ---- */
  @Get("users")
  @ApiBearerAuth()
  @Roles(Role.Owner, Role.Admin)
  listUsers(@CurrentUser() user: AuthUser) {
    return this.auth.listUsers(user.tenantId);
  }

  @Post("users")
  @ApiBearerAuth()
  @Roles(Role.Owner, Role.Admin)
  createUser(@CurrentUser() user: AuthUser, @Body() dto: CreateUserDto) {
    return this.auth.createUser(user.tenantId, dto);
  }
}
