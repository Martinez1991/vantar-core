import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { AuthUser } from "../../auth/auth.types";

/**
 * Injeta o tenantId do usuário autenticado (derivado do JWT pelo
 * JwtAuthGuard) — RS-IAM-006. Substitui o antigo header x-tenant-id.
 */
export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    if (!req.user?.tenantId) {
      throw new UnauthorizedException("Tenant não resolvido.");
    }
    return req.user.tenantId;
  },
);
