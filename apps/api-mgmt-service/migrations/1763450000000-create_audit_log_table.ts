import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAuditLogTable1763450000000 implements MigrationInterface {
  name = 'CreateAuditLogTable1763450000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for EventType
    await queryRunner.query(
      `CREATE TYPE "public"."audit_log_event_enum" AS ENUM('created', 'updated', 'deleted', 'user.login', 'user.register', 'password.reset', 'api_key.created', 'api_key.deleted', 'subscription.created', 'subscription.canceled')`,
    );

    // Create audit_log table
    await queryRunner.query(
      `CREATE TABLE "audit_log" (
        "id" bigserial NOT NULL,
        "actor_id" bigint NOT NULL,
        "event" "public"."audit_log_event_enum" NOT NULL,
        "resource_type" character varying(50),
        "resource_id" bigint,
        "metadata" jsonb,
        "ip_address" inet,
        "user_agent" text,
        "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_log_id" PRIMARY KEY ("id")
      )`,
    );

    // Create indexes for common queries
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_log_actor_id" ON "audit_log" ("actor_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_log_event" ON "audit_log" ("event")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_log_resource_type" ON "audit_log" ("resource_type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_log_timestamp" ON "audit_log" ("timestamp" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_log_actor_timestamp" ON "audit_log" ("actor_id", "timestamp" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_audit_log_actor_timestamp"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_log_timestamp"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_log_resource_type"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_log_event"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_log_actor_id"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "audit_log"`);

    // Drop enum type
    await queryRunner.query(`DROP TYPE "public"."audit_log_event_enum"`);
  }
}
