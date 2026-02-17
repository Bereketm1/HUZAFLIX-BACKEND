import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTestApiKeyToApis1768000000000 implements MigrationInterface {
  name = 'AddTestApiKeyToApis1768000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "apis" ADD "test_api_key" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "apis" DROP COLUMN "test_api_key"`);
  }
}
