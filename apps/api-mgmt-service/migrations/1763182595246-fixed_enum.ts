import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixedEnum1763182595246 implements MigrationInterface {
  name = 'FixedEnum1763182595246';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" DROP COLUMN "status"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_plans_status_enum" AS ENUM('inactive', 'active')`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ADD "status" "public"."subscription_plans_status_enum" NOT NULL DEFAULT 'active'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" DROP COLUMN "status"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."subscription_plans_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ADD "status" character varying(255) NOT NULL DEFAULT 'active'`,
    );
  }
}
