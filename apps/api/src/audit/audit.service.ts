import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLog } from "./audit-log.entity";

export type AuditEntry = {
  tenantId: string;
  userId: string | null;
  userEmail: string | null;
  method: string;
  path: string;
  statusCode: number;
  ip: string | null;
};

// Principais de máquina (API Key/SCIM) têm userId como "scim:..."/"apikey:...",
// que não é UUID. Coagimos a null para não abortar a transação no INSERT (a
// identidade fica em userEmail).
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog) private readonly logs: Repository<AuditLog>,
  ) {}

  /** Registra uma ação. Best-effort: nunca propaga erro para a requisição. */
  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.logs.insert({
        tenantId: entry.tenantId,
        userId: entry.userId && UUID_RE.test(entry.userId) ? entry.userId : null,
        userEmail: entry.userEmail,
        action: `${entry.method} ${entry.path}`,
        method: entry.method,
        path: entry.path,
        statusCode: entry.statusCode,
        ip: entry.ip,
      });
    } catch (e) {
      this.logger.warn(`Falha ao gravar auditoria: ${(e as Error).message}`);
    }
  }

  list(tenantId: string, limit = 100) {
    return this.logs.find({
      where: { tenantId },
      order: { createdAt: "DESC" },
      take: Math.min(limit, 500),
    });
  }
}
