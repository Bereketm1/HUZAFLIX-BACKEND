import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTransaction1767847506441 implements MigrationInterface {
    name = 'UpdateTransaction1767847506441'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "reference"`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD "reference" character varying(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "reference"`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD "reference" uuid NOT NULL`);
    }

}
