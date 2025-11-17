import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddedPlanTypeAndMultipleCallLimits1763338529430
  implements MigrationInterface
{
  name = 'AddedPlanTypeAndMultipleCallLimits1763338529430';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_plans_plan_type_enum" AS ENUM('monthly', 'yearly')`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ADD "plan_type" "public"."subscription_plans_plan_type_enum" NOT NULL DEFAULT 'monthly'`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ADD "daily_call_limit" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ADD "yearly_call_limit" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" DROP COLUMN "yearly_call_limit"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" DROP COLUMN "daily_call_limit"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" DROP COLUMN "plan_type"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."subscription_plans_plan_type_enum"`,
    );
  }
}
