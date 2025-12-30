import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitAuditLogs1767142500000 implements MigrationInterface {
  name = 'InitAuditLogs1767142500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(
      `CREATE TYPE "public"."audit_logs_actor_enum" AS ENUM('User', 'System')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."audit_logs_event_enum" AS ENUM('LOGIN', 'PAYMENT', 'API_KEY_GEN', 'SUB_UPDATE', 'API_MANAGEMENT', 'REQUEST', 'ADMIN_ACTION')`,
    );

    await queryRunner.query(
      `CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "actor" "public"."audit_logs_actor_enum" NOT NULL,
        "event" "public"."audit_logs_event_enum" NOT NULL,
        "status" integer NOT NULL,
        "ip_address" inet,
        "metadata" jsonb,
        CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_timestamp" ON "audit_logs" ("timestamp")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_actor" ON "audit_logs" ("actor")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_event" ON "audit_logs" ("event")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_status" ON "audit_logs" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_event"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_actor"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_timestamp"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TYPE "public"."audit_logs_event_enum"`);
    await queryRunner.query(`DROP TYPE "public"."audit_logs_actor_enum"`);
  }
}
