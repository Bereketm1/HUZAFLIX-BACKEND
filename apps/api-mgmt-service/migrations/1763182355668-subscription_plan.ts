import { MigrationInterface, QueryRunner } from 'typeorm';

export class SubscriptionPlan1763182355668 implements MigrationInterface {
  name = 'SubscriptionPlan1763182355668';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "subscription_plans" ("id" BIGSERIAL NOT NULL, "name" character varying(255) NOT NULL, "description" text, "monthly_price" numeric NOT NULL, "monthly_call_limit" integer NOT NULL, "avg_price_per_call" numeric NOT NULL, "status" character varying(255) NOT NULL DEFAULT 'active', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_9ab8fe6918451ab3d0a4fb6bb0c" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "subscription_plans"`);
  }
}
