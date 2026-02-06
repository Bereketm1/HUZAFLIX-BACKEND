import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueUserIdToBillings1767400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove duplicate billing profiles per user, keeping only the latest one
    await queryRunner.query(`
      DELETE FROM billings
      WHERE id NOT IN (
        SELECT MAX(id) FROM billings GROUP BY "userId"
      )
    `);

    // Add unique constraint on userId
    await queryRunner.query(`
      ALTER TABLE billings ADD CONSTRAINT "UQ_billings_userId" UNIQUE ("userId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE billings DROP CONSTRAINT "UQ_billings_userId"
    `);
  }
}
