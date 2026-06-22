import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuditLogs1782060500000 implements MigrationInterface {
  name = "AddAuditLogs1782060500000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "userId" uuid,
        "userEmail" character varying,
        "action" character varying NOT NULL,
        "method" character varying NOT NULL,
        "path" character varying NOT NULL,
        "statusCode" integer NOT NULL,
        "ip" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_tenant" ON "audit_logs" ("tenantId")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_tenant_created" ON "audit_logs" ("tenantId", "createdAt")`,
    );

    // Imutável (RS-AUD-002): o role do app só pode inserir e ler — sem
    // UPDATE/DELETE (revoga o que o ALTER DEFAULT PRIVILEGES concedeu).
    await queryRunner.query(`GRANT SELECT, INSERT ON "audit_logs" TO vantar_app`);
    await queryRunner.query(`REVOKE UPDATE, DELETE ON "audit_logs" FROM vantar_app`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "audit_logs"`);
  }
}
