import { MigrationInterface, QueryRunner } from 'typeorm';

export class Billing1764241464521 implements MigrationInterface {
  name = 'Billing1764241464521';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "billing" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "fullName" character varying NOT NULL, "email" character varying, "addressLine1" character varying, "addressLine2" character varying, "city" character varying, "state" character varying, "postalCode" character varying, "country" character varying, "phoneNumber" character varying, "credits" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_d9043caf3033c11ed3d1b29f73c" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "billing"`);
  }
}
