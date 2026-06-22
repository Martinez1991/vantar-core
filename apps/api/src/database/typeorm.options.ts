import { join } from "path";
import { DataSourceOptions } from "typeorm";
import { MaturitySnapshot } from "../analytics/maturity-snapshot.entity";
import { AuditLog } from "../audit/audit-log.entity";
import { RefreshToken } from "../auth/refresh-token.entity";
import { User } from "../auth/user.entity";
import { Project } from "../projects/project.entity";
import { Questionnaire } from "../questionnaires/questionnaire.entity";
import {
  ProjectRequirement,
  RequirementTemplate,
} from "../requirements/requirement.entity";
import { Risk } from "../risks/risk.entity";
import { Tenant } from "../tenants/tenant.entity";
import { ThreatModel } from "../threat-modeling/threat-model.entity";
import { Threat } from "../threat-modeling/threat.entity";

/**
 * Opções compartilhadas do TypeORM. O schema é gerenciado por **migrations**
 * (synchronize desligado): `migrate.ts` roda as migrations na subida, antes do
 * seed e do servidor. O glob de migrations resolve para .js em runtime (dist) e
 * .ts no CLI (ts-node).
 */
export function buildTypeOrmOptions(): DataSourceOptions {
  const url = process.env.DATABASE_URL;

  const base = {
    type: "postgres" as const,
    entities: [
      Tenant,
      Project,
      Risk,
      Questionnaire,
      User,
      ThreatModel,
      Threat,
      RequirementTemplate,
      ProjectRequirement,
      RefreshToken,
      MaturitySnapshot,
      AuditLog,
    ],
    migrations: [join(__dirname, "migrations", "*.{ts,js}")],
    migrationsTableName: "_vantar_migrations",
    synchronize: false,
    logging: process.env.DB_LOGGING === "true",
  };

  if (url) {
    return { ...base, url };
  }

  return {
    ...base,
    host: process.env.POSTGRES_HOST ?? "localhost",
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    username: process.env.POSTGRES_USER ?? "vantar",
    password: process.env.POSTGRES_PASSWORD ?? "vantar",
    database: process.env.POSTGRES_DB ?? "vantar",
  };
}
