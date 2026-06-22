import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1782058231341 implements MigrationInterface {
    name = 'InitialSchema1782058231341'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Extensões exigidas pelo schema (uuid_generate_v4) e pelo roadmap RAG.
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "vector"`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "email" character varying NOT NULL, "name" character varying NOT NULL, "passwordHash" character varying NOT NULL, "role" character varying NOT NULL DEFAULT 'developer', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c58f7e88c286e5e3478960a998" ON "users" ("tenantId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TABLE "projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "name" character varying NOT NULL, "description" text, "owner" character varying NOT NULL, "criticality" character varying NOT NULL DEFAULT 'Média', "environment" character varying NOT NULL DEFAULT 'Cloud', "dataClasses" text array NOT NULL DEFAULT '{}', "tags" text array NOT NULL DEFAULT '{}', "openRisks" integer NOT NULL DEFAULT '0', "securityScore" integer NOT NULL DEFAULT '0', "archived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_448b2462c0d35a96a820c926e0" ON "projects" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ee1847d4bb55043a21455febc8" ON "projects" ("tenantId", "archived") `);
        await queryRunner.query(`CREATE TABLE "questionnaires" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "projectId" uuid NOT NULL, "templateId" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'draft', "answers" jsonb NOT NULL DEFAULT '{}', "securityScore" integer NOT NULL DEFAULT '0', "maturityLevel" character varying NOT NULL DEFAULT 'Inicial', "riskLevel" character varying NOT NULL DEFAULT 'critical', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "completedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_a01d7cdea895ed9796b29233610" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_482dcb1001e3f430f1d3821d3a" ON "questionnaires" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_eb2feb0e1dfbfaeb930dfd11b8" ON "questionnaires" ("projectId") `);
        await queryRunner.query(`CREATE INDEX "IDX_799a7d0e0d1ce39f85d2bac4c1" ON "questionnaires" ("tenantId", "projectId") `);
        await queryRunner.query(`CREATE TABLE "requirement_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "code" character varying NOT NULL, "title" character varying NOT NULL, "description" text, "framework" character varying NOT NULL, "control" character varying NOT NULL, "category" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_337155f57a03f59c0ba6e9ad3cf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3f7fdd994348490aaefc642a85" ON "requirement_templates" ("tenantId") `);
        await queryRunner.query(`CREATE TABLE "project_requirements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "projectId" uuid NOT NULL, "templateId" uuid, "code" character varying NOT NULL, "title" character varying NOT NULL, "description" text, "framework" character varying NOT NULL, "control" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'proposed', "approvedBy" character varying, "approvedAt" TIMESTAMP WITH TIME ZONE, "rejectionReason" text, "threatId" uuid, "source" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8cfbc946a2306000e228d9eeea7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a828e5d59120d3e2e9f0dbaa36" ON "project_requirements" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f15f1a2e6c235a2266653245d7" ON "project_requirements" ("projectId") `);
        await queryRunner.query(`CREATE INDEX "IDX_de6bafd3c5a625aad387be9d45" ON "project_requirements" ("tenantId", "projectId") `);
        await queryRunner.query(`CREATE TABLE "risks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "projectId" uuid NOT NULL, "title" character varying NOT NULL, "description" text, "category" character varying, "likelihood" integer NOT NULL DEFAULT '3', "impact" integer NOT NULL DEFAULT '3', "status" character varying NOT NULL DEFAULT 'open', "mitigationPlan" text, "mitigationOwner" character varying, "mitigationDueDate" date, "residualLikelihood" integer, "residualImpact" integer, "acceptedBy" character varying, "acceptanceJustification" text, "acceptedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_df437126f5dd05e856b8bf7157f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4812dd89bb9a86d517d3dae3d6" ON "risks" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_74849b6ccb5ac008ef53558571" ON "risks" ("projectId") `);
        await queryRunner.query(`CREATE INDEX "IDX_58bb55194190b715b2fc9d1bff" ON "risks" ("tenantId", "projectId") `);
        await queryRunner.query(`CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "name" character varying NOT NULL, "plan" character varying NOT NULL DEFAULT 'community', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2310ecc5cb8be427097154b18fc" UNIQUE ("slug"), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "threat_models" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "projectId" uuid NOT NULL, "name" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'draft', "dfd" jsonb NOT NULL DEFAULT '{"nodes":[],"flows":[]}', "version" integer NOT NULL DEFAULT '1', "threatAtlasRef" character varying, "syncedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0272a7078234ebc2e8cf4485182" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d4e8bb5d686e4566cca71c4193" ON "threat_models" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c6f566a084eae5e082b96b23ab" ON "threat_models" ("projectId") `);
        await queryRunner.query(`CREATE INDEX "IDX_dd7299abefd481e153a9c0c5a0" ON "threat_models" ("tenantId", "projectId") `);
        await queryRunner.query(`CREATE TABLE "threats" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "threatModelId" uuid NOT NULL, "elementId" character varying, "elementName" character varying, "category" character varying NOT NULL, "title" character varying NOT NULL, "description" text, "mitigation" text, "status" character varying NOT NULL DEFAULT 'open', "riskId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c1262f46306b0579632d9faa98a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_cd87a0cea344b168ce9c90d7e0" ON "threats" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c108df35745c874548998fd94a" ON "threats" ("threatModelId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9b9b924c79840745cb821729ed" ON "threats" ("tenantId", "threatModelId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_9b9b924c79840745cb821729ed"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c108df35745c874548998fd94a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cd87a0cea344b168ce9c90d7e0"`);
        await queryRunner.query(`DROP TABLE "threats"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dd7299abefd481e153a9c0c5a0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c6f566a084eae5e082b96b23ab"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d4e8bb5d686e4566cca71c4193"`);
        await queryRunner.query(`DROP TABLE "threat_models"`);
        await queryRunner.query(`DROP TABLE "tenants"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_58bb55194190b715b2fc9d1bff"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_74849b6ccb5ac008ef53558571"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4812dd89bb9a86d517d3dae3d6"`);
        await queryRunner.query(`DROP TABLE "risks"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_de6bafd3c5a625aad387be9d45"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f15f1a2e6c235a2266653245d7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a828e5d59120d3e2e9f0dbaa36"`);
        await queryRunner.query(`DROP TABLE "project_requirements"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3f7fdd994348490aaefc642a85"`);
        await queryRunner.query(`DROP TABLE "requirement_templates"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_799a7d0e0d1ce39f85d2bac4c1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_eb2feb0e1dfbfaeb930dfd11b8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_482dcb1001e3f430f1d3821d3a"`);
        await queryRunner.query(`DROP TABLE "questionnaires"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ee1847d4bb55043a21455febc8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_448b2462c0d35a96a820c926e0"`);
        await queryRunner.query(`DROP TABLE "projects"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c58f7e88c286e5e3478960a998"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
