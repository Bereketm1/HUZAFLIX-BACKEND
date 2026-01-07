import { MigrationInterface, QueryRunner } from 'typeorm';

export class SquashApiMigrations1766400136761 implements MigrationInterface {
  name = 'SquashApiMigrations1766400136761';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."api_keys_status_enum" AS ENUM('active')`,
    );
    await queryRunner.query(
      `CREATE TABLE "api_keys" ("id" BIGSERIAL NOT NULL, "user_id" bigint NOT NULL, "key_hash" bytea NOT NULL, "key_prefix" character(8) NOT NULL, "name" character varying(100), "rate_limit_per_minute" integer NOT NULL DEFAULT '60', "quota_daily" integer, "quota_monthly" integer, "expires_at" TIMESTAMP WITH TIME ZONE, "status" "public"."api_keys_status_enum" NOT NULL DEFAULT 'active', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "revoked_at" TIMESTAMP WITH TIME ZONE, "api_id" bigint, CONSTRAINT "UQ_57384430aa1959f4578046c9b81" UNIQUE ("key_hash"), CONSTRAINT "PK_5c8a79801b44bd27b79228e1dad" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."apis_type_enum" AS ENUM('rest', 'graphql', 'soap', 'webhook', 'websocket')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."apis_status_enum" AS ENUM('inactive', 'active')`,
    );
    await queryRunner.query(
      `CREATE TABLE "apis" ("id" BIGSERIAL NOT NULL, "name" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "avg_response_time" numeric NOT NULL, "company_name" character varying(255) DEFAULT 'Huzalabs', "company_contact_email" character varying(255) DEFAULT 'info@huzalabs.com', "company_contact_phone" character varying(255) DEFAULT '+1234567890', "description" text, "category" character varying(255) NOT NULL, "type" "public"."apis_type_enum" NOT NULL, "tags" text array, "base_path" character varying(255) NOT NULL, "base_api_key" text NOT NULL, "version" character varying(50) NOT NULL, "status" "public"."apis_status_enum" NOT NULL DEFAULT 'inactive', "openapi_spec_url" character varying(1024), "created_by" bigint NOT NULL, "activated_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_764266eafe31251723c495bbfc2" UNIQUE ("slug"), CONSTRAINT "UQ_71a51f64cb0e4e1e6db23364d51" UNIQUE ("base_path"), CONSTRAINT "PK_a74a5f3f4f08faf9f6329bceae6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_plans_plan_type_enum" AS ENUM('monthly', 'yearly')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_plans_status_enum" AS ENUM('inactive', 'active')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscription_plans" ("id" BIGSERIAL NOT NULL, "name" character varying(255) NOT NULL, "description" text, "plan_type" "public"."subscription_plans_plan_type_enum" NOT NULL DEFAULT 'monthly', "monthly_price" numeric NOT NULL, "yearly_price" numeric NOT NULL, "daily_call_limit" integer NOT NULL, "monthly_call_limit" integer NOT NULL, "yearly_call_limit" integer, "avg_price_per_call" numeric NOT NULL, "status" "public"."subscription_plans_status_enum" NOT NULL DEFAULT 'active', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_9ab8fe6918451ab3d0a4fb6bb0c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('active', 'expired', 'cancelled', 'past_due')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscriptions" ("id" BIGSERIAL NOT NULL, "api_id" bigint NOT NULL, "user_id" bigint, "plan_id" bigint NOT NULL, "start_date" TIMESTAMP WITH TIME ZONE NOT NULL, "end_date" TIMESTAMP WITH TIME ZONE NOT NULL, "auto_renew" boolean NOT NULL DEFAULT false, "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'active', "calls_used_this_cycle" integer NOT NULL DEFAULT '0', "current_cycle_start" TIMESTAMP WITH TIME ZONE NOT NULL, "current_cycle_end" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "favourites" ("id" BIGSERIAL NOT NULL, "userId" bigint NOT NULL, "api_id" bigint NOT NULL, CONSTRAINT "PK_173e5d5cc35490bf1de2d2d3739" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."audit_log_event_enum" AS ENUM('created', 'updated', 'deleted', 'user.login', 'user.register', 'password.reset', 'api_key.created', 'api_key.deleted', 'subscription.created', 'subscription.canceled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_log" ("id" BIGSERIAL NOT NULL, "actor_id" bigint NOT NULL, "event" "public"."audit_log_event_enum" NOT NULL, "resource_type" character varying(50), "resource_id" bigint, "metadata" jsonb, "ip_address" inet, "user_agent" text, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_07fefa57f7f5ab8fc3f52b3ed0b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_keys" ADD CONSTRAINT "FK_6bbcf643f7359258224f1712843" FOREIGN KEY ("api_id") REFERENCES "apis"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_ce2d8958ac3b59e1dd4eea29e19" FOREIGN KEY ("api_id") REFERENCES "apis"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_e45fca5d912c3a2fab512ac25dc" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "favourites" ADD CONSTRAINT "FK_278b66f0d75ab8172ee6704fc46" FOREIGN KEY ("api_id") REFERENCES "apis"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "favourites" DROP CONSTRAINT "FK_278b66f0d75ab8172ee6704fc46"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_e45fca5d912c3a2fab512ac25dc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_ce2d8958ac3b59e1dd4eea29e19"`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_keys" DROP CONSTRAINT "FK_6bbcf643f7359258224f1712843"`,
    );
    await queryRunner.query(`DROP TABLE "audit_log"`);
    await queryRunner.query(`DROP TYPE "public"."audit_log_event_enum"`);
    await queryRunner.query(`DROP TABLE "favourites"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
    await queryRunner.query(`DROP TABLE "subscription_plans"`);
    await queryRunner.query(
      `DROP TYPE "public"."subscription_plans_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."subscription_plans_plan_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE "apis"`);
    await queryRunner.query(`DROP TYPE "public"."apis_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."apis_type_enum"`);
    await queryRunner.query(`DROP TABLE "api_keys"`);
    await queryRunner.query(`DROP TYPE "public"."api_keys_status_enum"`);
  }
}
