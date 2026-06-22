import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { from, lastValueFrom, Observable } from "rxjs";
import { Repository } from "typeorm";
import { runInTransaction } from "typeorm-transactional";
import { AuthUser } from "../../auth/auth.types";
import { Tenant } from "../../tenants/tenant.entity";

/**
 * Define o GUC `app.current_tenant` por requisição autenticada (RS-IAM-006),
 * que as policies de Row-Level Security usam para isolar dados entre tenants.
 * Cada requisição autenticada roda numa transação onde o GUC é setado primeiro;
 * as queries dos serviços (patched por typeorm-transactional) usam a mesma
 * conexão e, portanto, enxergam apenas o tenant corrente.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(Tenant) private readonly repo: Repository<Tenant>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const tenantId = req.user?.tenantId;
    if (!tenantId) return next.handle();

    return from(
      runInTransaction(async () => {
        await this.repo.query("SELECT set_config('app.current_tenant', $1, true)", [
          tenantId,
        ]);
        return lastValueFrom(next.handle());
      }),
    );
  }
}
