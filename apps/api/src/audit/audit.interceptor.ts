import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { catchError, concatMap, Observable, throwError } from "rxjs";
import { AuthUser } from "../auth/auth.types";
import { AuditService } from "./audit.service";

const AUDITED = new Set(["POST", "PATCH", "PUT", "DELETE"]);

/**
 * Registra ações sensíveis (mutações autenticadas) na trilha de auditoria.
 * Roda dentro da transação de tenant (registrado após o AuthModule), então o
 * INSERT acompanha a requisição.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const res = context.switchToHttp().getResponse<Response>();
    const user = req.user;
    if (!user || !AUDITED.has(req.method)) return next.handle();

    const base = {
      tenantId: user.tenantId,
      userId: user.userId,
      userEmail: user.email,
      method: req.method,
      path: req.path,
      ip: req.ip ?? req.socket?.remoteAddress ?? null,
    };

    return next.handle().pipe(
      concatMap(async (data) => {
        await this.audit.record({ ...base, statusCode: res.statusCode || 200 });
        return data;
      }),
      catchError((err) => {
        void this.audit.record({ ...base, statusCode: err?.status ?? 500 });
        return throwError(() => err);
      }),
    );
  }
}
