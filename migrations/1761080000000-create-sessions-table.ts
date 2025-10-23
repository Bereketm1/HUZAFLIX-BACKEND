import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSessionsTable1761080000000 implements MigrationInterface {
  name = 'CreateSessionsTable1761080000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "sessions" (
        "id" SERIAL PRIMARY KEY,
        "user_id" integer NOT NULL,
        "jti" integer,
        "token" text,
        "type" text NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE,
        "used_at" TIMESTAMP WITH TIME ZONE,
        "revoked" boolean DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
      )`,
    );

    // drop the columns from users
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "password_reset_expires"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "password_reset_token"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // add columns back to users
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "password_reset_token" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "password_reset_expires" TIMESTAMP WITH TIME ZONE`,
    );

    // migrate sessions back into users for password_reset type
    await queryRunner.query(
      `UPDATE "users" u
       SET password_reset_token = s.token,
           password_reset_expires = s.expires_at
       FROM "sessions" s
       WHERE s.user_id = u.id AND s.type = 'password_reset'`,
    );

    await queryRunner.query(`DROP TABLE "sessions"`);
  }
}
