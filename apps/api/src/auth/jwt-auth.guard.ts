import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { AuthUser, JwtPayload } from "./auth.types";
import { IS_PUBLIC_KEY } from "./decorators";

/**
 * Guard global de autenticação (RS-IAM-005). Valida o Bearer JWT em toda
 * rota, exceto as marcadas com @Public. Popula req.user (e, portanto, o
 * tenant) a partir do token — não mais de um header confiável.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request & { user: AuthUser }>();
    const auth = req.header("authorization");
    if (!auth?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Token ausente.");
    }
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(auth.slice(7));
      req.user = {
        userId: payload.sub,
        tenantId: payload.tenantId,
        email: payload.email,
        role: payload.role,
      };
      return true;
    } catch {
      throw new UnauthorizedException("Token inválido ou expirado.");
    }
  }
}
