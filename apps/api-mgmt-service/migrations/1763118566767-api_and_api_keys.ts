import { MigrationInterface, QueryRunner } from 'typeorm';

export class ApiAndApiKeys1763118566767 implements MigrationInterface {
  name = 'ApiAndApiKeys1763118566767';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."api_keys_status_enum" AS ENUM('active')`,
    );
    await queryRunner.query(
      `CREATE TABLE "api_keys" ("id" BIGSERIAL NOT NULL, "user_id" bigint NOT NULL, "key_hash" bytea NOT NULL, "key_prefix" character(8) NOT NULL, "name" character varying(100), "rate_limit_per_minute" integer NOT NULL DEFAULT '60', "quota_daily" integer, "quota_monthly" integer, "expires_at" TIMESTAMP WITH TIME ZONE, "status" "public"."api_keys_status_enum" NOT NULL DEFAULT 'active', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "revoked_at" TIMESTAMP WITH TIME ZONE, "api_id" bigint, CONSTRAINT "UQ_57384430aa1959f4578046c9b81" UNIQUE ("key_hash"), CONSTRAINT "PK_5c8a79801b44bd27b79228e1dad" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."apis_status_enum" AS ENUM('inactive', 'active')`,
    );
    await queryRunner.query(
      `CREATE TABLE "apis" ("id" BIGSERIAL NOT NULL, "name" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "avg_response_time" numeric NOT NULL, "company_name" character varying(255) DEFAULT 'Huzalabs', "company_contact_email" character varying(255) DEFAULT 'info@huzalabs.com', "company_contact_phone" character varying(255) DEFAULT '+1234567890', "description" text, "category" character varying(255) NOT NULL, "tags" text array, "base_path" character varying(255) NOT NULL, "base_api_key" text NOT NULL, "version" character varying(50) NOT NULL, "status" "public"."apis_status_enum" NOT NULL DEFAULT 'active', "openapi_spec_url" character varying(1024), "created_by" bigint NOT NULL, "activated_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_764266eafe31251723c495bbfc2" UNIQUE ("slug"), CONSTRAINT "UQ_71a51f64cb0e4e1e6db23364d51" UNIQUE ("base_path"), CONSTRAINT "PK_a74a5f3f4f08faf9f6329bceae6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_keys" ADD CONSTRAINT "FK_6bbcf643f7359258224f1712843" FOREIGN KEY ("api_id") REFERENCES "apis"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "api_keys" DROP CONSTRAINT "FK_6bbcf643f7359258224f1712843"`,
    );
    await queryRunner.query(`DROP TABLE "apis"`);
    await queryRunner.query(`DROP TYPE "public"."apis_status_enum"`);
    await queryRunner.query(`DROP TABLE "api_keys"`);
    await queryRunner.query(`DROP TYPE "public"."api_keys_status_enum"`);
  }
}
