import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorConsumerApiKeys1768100000000 implements MigrationInterface {
  name = 'RefactorConsumerApiKeys1768100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."api_keys_status_enum" ADD VALUE IF NOT EXISTS 'inactive'`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_keys" DROP COLUMN IF EXISTS "rate_limit_per_minute"`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_keys" DROP COLUMN IF EXISTS "quota_daily"`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_keys" DROP COLUMN IF EXISTS "quota_monthly"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "api_keys" ADD COLUMN "rate_limit_per_minute" integer NOT NULL DEFAULT '60'`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_keys" ADD COLUMN "quota_daily" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_keys" ADD COLUMN "quota_monthly" integer`,
    );
    await queryRunner.query(
      `UPDATE "api_keys" SET "status" = 'active' WHERE "status" = 'inactive'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."api_keys_status_enum" RENAME TO "api_keys_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."api_keys_status_enum" AS ENUM('active')`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_keys" ALTER COLUMN "status" TYPE "public"."api_keys_status_enum" USING "status"::text::"public"."api_keys_status_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."api_keys_status_enum_old"`);
  }
}
