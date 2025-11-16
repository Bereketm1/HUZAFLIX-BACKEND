import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedTypeAndFixedApiStatusDefault1763268068833 implements MigrationInterface {
    name = 'AddedTypeAndFixedApiStatusDefault1763268068833'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."apis_type_enum" AS ENUM('rest', 'graphql', 'soap', 'webhook', 'websocket')`);
        await queryRunner.query(`ALTER TABLE "apis" ADD "type" "public"."apis_type_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "apis" ALTER COLUMN "status" SET DEFAULT 'inactive'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "apis" ALTER COLUMN "status" SET DEFAULT 'active'`);
        await queryRunner.query(`ALTER TABLE "apis" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."apis_type_enum"`);
    }

}
