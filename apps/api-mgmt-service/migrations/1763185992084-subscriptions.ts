import { MigrationInterface, QueryRunner } from 'typeorm';

export class Subscriptions1763185992084 implements MigrationInterface {
  name = 'Subscriptions1763185992084';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('active', 'expired', 'cancelled', 'past_due')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscriptions" ("id" BIGSERIAL NOT NULL, "user_id" bigint, "plan_id" bigint NOT NULL, "start_date" TIMESTAMP WITH TIME ZONE NOT NULL, "end_date" TIMESTAMP WITH TIME ZONE NOT NULL, "auto_renew" boolean NOT NULL DEFAULT true, "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'active', "calls_used_this_cycle" integer NOT NULL DEFAULT '0', "current_cycle_start" TIMESTAMP WITH TIME ZONE NOT NULL, "current_cycle_end" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_e45fca5d912c3a2fab512ac25dc" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_e45fca5d912c3a2fab512ac25dc"`,
    );
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
  }
}
