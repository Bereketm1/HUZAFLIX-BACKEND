import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdditionalFieldsForApi1763055920539 implements MigrationInterface {
  name = 'AdditionalFieldsForApi1763055920539';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "apis" DROP CONSTRAINT "UQ_5e144c098f59ecaa09dcbebef1d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "apis" DROP COLUMN "openapi_spec_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "apis" ADD "company_name" character varying(255) DEFAULT 'Huzalabs'`,
    );
    await queryRunner.query(
      `ALTER TABLE "apis" ADD "company_contact_email" character varying(255) DEFAULT 'info@huzalabs.com'`,
    );
    await queryRunner.query(
      `ALTER TABLE "apis" ADD "company_contact_phone" character varying(255) DEFAULT '+1234567890'`,
    );
    await queryRunner.query(
      `ALTER TABLE "apis" ADD "category" character varying(255) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "apis" ADD "tags" text array`);
    await queryRunner.query(
      `ALTER TABLE "apis" ADD "base_api_key" text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "apis" ADD CONSTRAINT "UQ_7aee505e7c8ac8b98bf3b48e9ff" UNIQUE ("base_api_key")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "apis" DROP CONSTRAINT "UQ_7aee505e7c8ac8b98bf3b48e9ff"`,
    );
    await queryRunner.query(`ALTER TABLE "apis" DROP COLUMN "base_api_key"`);
    await queryRunner.query(`ALTER TABLE "apis" DROP COLUMN "tags"`);
    await queryRunner.query(`ALTER TABLE "apis" DROP COLUMN "category"`);
    await queryRunner.query(
      `ALTER TABLE "apis" DROP COLUMN "company_contact_phone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "apis" DROP COLUMN "company_contact_email"`,
    );
    await queryRunner.query(`ALTER TABLE "apis" DROP COLUMN "company_name"`);
    await queryRunner.query(
      `ALTER TABLE "apis" ADD "openapi_spec_key" character varying(512)`,
    );
    await queryRunner.query(
      `ALTER TABLE "apis" ADD CONSTRAINT "UQ_5e144c098f59ecaa09dcbebef1d" UNIQUE ("openapi_spec_key")`,
    );
  }
}
