import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemovedApiFromPlan1763365271588 implements MigrationInterface {
  name = 'RemovedApiFromPlan1763365271588';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_ce2d8958ac3b59e1dd4eea29e19"`,
    );
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "api_id"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD "api_id" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_ce2d8958ac3b59e1dd4eea29e19" FOREIGN KEY ("api_id") REFERENCES "apis"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
