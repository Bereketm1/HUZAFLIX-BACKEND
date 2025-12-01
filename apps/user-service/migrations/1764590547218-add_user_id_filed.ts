import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIdFiled1764590547218 implements MigrationInterface {
  name = 'AddUserIdFiled1764590547218';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "mfas" DROP CONSTRAINT "FK_e94f668e07be6462dbd894c70a9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "mfas" ALTER COLUMN "user_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "mfas" ADD CONSTRAINT "FK_e94f668e07be6462dbd894c70a9" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "mfas" DROP CONSTRAINT "FK_e94f668e07be6462dbd894c70a9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "mfas" ALTER COLUMN "user_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "mfas" ADD CONSTRAINT "FK_e94f668e07be6462dbd894c70a9" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
