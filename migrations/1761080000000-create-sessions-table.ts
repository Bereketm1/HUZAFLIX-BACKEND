import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSessionsTable1761080000000 implements MigrationInterface {
  name = 'CreateSessionsTable1761080000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "sessions" (
        "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        "user_id" integer NOT NULL,
        "jti" text,
        "token" text,
        "type" text NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE,
        "used_at" TIMESTAMP WITH TIME ZONE,
        "revoked" boolean DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
      )`,
    );

    // migrate existing user password reset tokens into sessions table
    // only migrate non-null tokens
    await queryRunner.query(
      `INSERT INTO "sessions" (user_id, token, type, expires_at, created_at, updated_at)
       SELECT id, password_reset_token, 'password_reset', password_reset_expires, now(), now()
       FROM "users"
       WHERE password_reset_token IS NOT NULL`,
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
