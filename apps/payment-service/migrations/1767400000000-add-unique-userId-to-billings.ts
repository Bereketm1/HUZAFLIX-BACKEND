import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueUserIdToBillings1767400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Defensive: skip if table doesn't exist (migration ordering / fresh DBs).
    const hasTable = await queryRunner.hasTable('billings');
    if (!hasTable) return;

    // Remove duplicate billing profiles per user, keeping only the latest one
    await queryRunner.query(`
      DELETE FROM billings
      WHERE id NOT IN (
        SELECT MAX(id) FROM billings GROUP BY "userId"
      )
    `);

    // Add unique constraint on userId if it doesn't already exist
    const existing = await queryRunner.query(
      `SELECT conname FROM pg_constraint WHERE conname = 'UQ_billings_userId'`,
    );
    if ((existing as any[]).length === 0) {
      await queryRunner.query(`
        ALTER TABLE billings ADD CONSTRAINT "UQ_billings_userId" UNIQUE ("userId")
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('billings');
    if (!hasTable) return;

    const existing = await queryRunner.query(
      `SELECT conname FROM pg_constraint WHERE conname = 'UQ_billings_userId'`,
    );
    if ((existing as any[]).length > 0) {
      await queryRunner.query(`
        ALTER TABLE billings DROP CONSTRAINT "UQ_billings_userId"
      `);
    }
  }
}
