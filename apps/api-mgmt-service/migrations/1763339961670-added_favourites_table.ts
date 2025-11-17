import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedFavouritesTable1763339961670 implements MigrationInterface {
    name = 'AddedFavouritesTable1763339961670'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "favourites" ("id" BIGSERIAL NOT NULL, "userId" bigint NOT NULL, "api_id" bigint NOT NULL, CONSTRAINT "PK_173e5d5cc35490bf1de2d2d3739" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "favourites" ADD CONSTRAINT "FK_278b66f0d75ab8172ee6704fc46" FOREIGN KEY ("api_id") REFERENCES "apis"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "favourites" DROP CONSTRAINT "FK_278b66f0d75ab8172ee6704fc46"`);
        await queryRunner.query(`DROP TABLE "favourites"`);
    }

}
