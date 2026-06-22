import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { AuthUser } from "./auth.types";
import { ROLES_KEY } from "./decorators";
import { Role } from "./user.entity";

// owner e admin têm acesso administrativo amplo.
const ADMIN_ROLES: Role[] = [Role.Owner, Role.Admin];

/**
 * Guard de RBAC (RS-IAM-005). Rotas sem @Roles são liberadas a qualquer
 * usuário autenticado; com @Roles, exige um papel permitido (owner/admin
 * sempre passam).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest<Request & { user: AuthUser }>();
    const role = req.user?.role;
    if (role && (ADMIN_ROLES.includes(role) || required.includes(role))) {
      return true;
    }
    throw new ForbiddenException(
      "Seu papel não tem permissão para esta ação.",
    );
  }
}
