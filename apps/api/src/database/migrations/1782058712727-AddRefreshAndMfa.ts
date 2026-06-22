import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRefreshAndMfa1782058712727 implements MigrationInterface {
    name = 'AddRefreshAndMfa1782058712727'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "tenantId" uuid NOT NULL, "tokenHash" character varying NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "revokedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_610102b60fea1455310ccd299d" ON "refresh_tokens" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c25bc63d248ca90e8dcc1d92d0" ON "refresh_tokens" ("tokenHash") `);
        await queryRunner.query(`ALTER TABLE "users" ADD "mfaSecret" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "mfaEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "threat_models" ALTER COLUMN "dfd" SET DEFAULT '{"nodes":[],"flows":[]}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "threat_models" ALTER COLUMN "dfd" SET DEFAULT '{"flows": [], "nodes": []}'`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "mfaEnabled"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "mfaSecret"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c25bc63d248ca90e8dcc1d92d0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_610102b60fea1455310ccd299d"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    }

}
