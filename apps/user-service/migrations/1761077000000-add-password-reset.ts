import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordReset1761077000000 implements MigrationInterface {
  name = 'AddPasswordReset1761077000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "password_reset_token" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "password_reset_expires" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "password_reset_expires"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "password_reset_token"`,
    );
  }
}
