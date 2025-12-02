import { MigrationInterface, QueryRunner } from 'typeorm';

export class Mfa1764588499397 implements MigrationInterface {
  name = 'Mfa1764588499397';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "mfas" DROP CONSTRAINT "UQ_025392601d715626092e1cf3f67"`,
    );
    await queryRunner.query(`ALTER TABLE "mfas" DROP COLUMN "email"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "mfas" ADD "email" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "mfas" ADD CONSTRAINT "UQ_025392601d715626092e1cf3f67" UNIQUE ("email")`,
    );
  }
}
