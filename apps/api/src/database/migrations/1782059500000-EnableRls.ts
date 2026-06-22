import { MigrationInterface, QueryRunner } from "typeorm";

// Tabelas de negócio isoladas por tenant (RS-IAM-006). users/tenants/
// refresh_tokens ficam de fora: auth/login/refresh ocorrem sem contexto de tenant.
const TABLES = [
  "projects",
  "risks",
  "questionnaires",
  "threat_models",
  "threats",
  "requirement_templates",
  "project_requirements",
];

export class EnableRls1782059500000 implements MigrationInterface {
  name = "EnableRls1782059500000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Privilégios ao role do app (não-superuser) sobre o schema existente.
    await queryRunner.query(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO vantar_app`,
    );
    await queryRunner.query(
      `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO vantar_app`,
    );

    for (const t of TABLES) {
      await queryRunner.query(`ALTER TABLE "${t}" ENABLE ROW LEVEL SECURITY`);
      // FORCE: aplica RLS inclusive ao owner não-superuser (vantar_app).
      await queryRunner.query(`ALTER TABLE "${t}" FORCE ROW LEVEL SECURITY`);
      await queryRunner.query(
        `CREATE POLICY tenant_isolation ON "${t}" ` +
          `USING ("tenantId" = current_setting('app.current_tenant', true)::uuid) ` +
          `WITH CHECK ("tenantId" = current_setting('app.current_tenant', true)::uuid)`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const t of TABLES) {
      await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation ON "${t}"`);
      await queryRunner.query(`ALTER TABLE "${t}" DISABLE ROW LEVEL SECURITY`);
    }
  }
}
