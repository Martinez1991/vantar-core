import { MigrationInterface, QueryRunner } from "typeorm";

export class AddThreatAtlasComments1782063500000 implements MigrationInterface {
  name = "AddThreatAtlasComments1782063500000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Estado colaborativo lido de volta do ThreatAtlas (pull bidirecional, RF-TM-006).
    await queryRunner.query(
      `ALTER TABLE "threat_models" ADD COLUMN IF NOT EXISTS "atlasComments" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "threat_models" DROP COLUMN IF EXISTS "atlasComments"`,
    );
  }
}
