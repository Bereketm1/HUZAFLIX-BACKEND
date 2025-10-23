import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRolesTimestamps1761076000000 implements MigrationInterface {
  name = 'AddRolesTimestamps1761076000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN IF EXISTS "updated_at"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN IF EXISTS "created_at"`);
  }
}
