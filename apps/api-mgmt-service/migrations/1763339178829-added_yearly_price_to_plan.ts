import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedYearlyPriceToPlan1763339178829 implements MigrationInterface {
    name = 'AddedYearlyPriceToPlan1763339178829'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "yearly_price" numeric NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "yearly_price"`);
    }

}
