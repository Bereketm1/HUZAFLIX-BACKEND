import { MigrationInterface, QueryRunner } from 'typeorm';

export class NullifyOpenapiDetails1762992317651 implements MigrationInterface {
  name = 'NullifyOpenapiDetails1762992317651';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "apis" ALTER COLUMN "openapi_spec_key" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "apis" ALTER COLUMN "openapi_spec_url" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "apis" ALTER COLUMN "openapi_spec_url" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "apis" ALTER COLUMN "openapi_spec_key" SET NOT NULL`,
    );
  }
}
