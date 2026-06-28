import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLoginLockoutFields1782065600000 implements MigrationInterface {
  name = "AddLoginLockoutFields1782065600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Account lockout / anti brute-force (RS-IAM-004, SEC-03): contador de
    // falhas consecutivas + instante até quando a conta fica bloqueada.
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "lockedUntil"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "failedLoginAttempts"`,
    );
  }
}
