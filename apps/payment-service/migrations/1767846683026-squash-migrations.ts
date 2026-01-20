import { MigrationInterface, QueryRunner } from 'typeorm';

export class SquashMigrations1767846683026 implements MigrationInterface {
  name = 'SquashMigrations1767846683026';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "transactions" ("id" BIGSERIAL NOT NULL, "reference" uuid NOT NULL, "userId" bigint NOT NULL, "amount" numeric NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "billings" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "fullName" character varying NOT NULL, "email" character varying, "phoneNumber" character varying, "country" character varying, "city" character varying, "addressLine1" character varying, "addressLine2" character varying, "state" character varying, "postalCode" character varying, "defaultPaymentMethod" character varying, "stripeCustomerId" character varying, "stripePaymentMethodId" character varying, "credits" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b4c005480bcc7e02a04880c8b27" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "billings"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
  }
}
