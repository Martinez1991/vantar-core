import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMaturitySnapshots1782060000000 implements MigrationInterface {
  name = "AddMaturitySnapshots1782060000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "maturity_snapshots" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "capturedAt" date NOT NULL,
        "avgSecurityScore" integer NOT NULL DEFAULT 0,
        "projectCount" integer NOT NULL DEFAULT 0,
        "openRisks" integer NOT NULL DEFAULT 0,
        "criticalRisks" integer NOT NULL DEFAULT 0,
        "requirementsApproved" integer NOT NULL DEFAULT 0,
        "requirementsTotal" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_maturity_snapshots" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_maturity_snapshots_tenant" ON "maturity_snapshots" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_maturity_snapshots_tenant_day" ON "maturity_snapshots" ("tenantId", "capturedAt")`,
    );

    // RLS — consistente com as demais tabelas de negócio.
    await queryRunner.query(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON "maturity_snapshots" TO vantar_app`,
    );
    await queryRunner.query(`ALTER TABLE "maturity_snapshots" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "maturity_snapshots" FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(
      `CREATE POLICY tenant_isolation ON "maturity_snapshots" ` +
        `USING ("tenantId" = current_setting('app.current_tenant', true)::uuid) ` +
        `WITH CHECK ("tenantId" = current_setting('app.current_tenant', true)::uuid)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation ON "maturity_snapshots"`);
    await queryRunner.query(`DROP TABLE "maturity_snapshots"`);
  }
}
