import { MigrationInterface, QueryRunner } from "typeorm";

export class PaymentRequestAndTransaction1763645003268 implements MigrationInterface {
    name = 'PaymentRequestAndTransaction1763645003268'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."payment_requests_status_enum" AS ENUM('pending', 'success', 'failed')`);
        await queryRunner.query(`CREATE TABLE "payment_requests" ("id" BIGSERIAL NOT NULL, "userId" bigint NOT NULL, "amount" numeric NOT NULL, "remark" text, "method" text, "status" "public"."payment_requests_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_9299e570c6d9babbe54752e16ec" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" BIGSERIAL NOT NULL, "reference" uuid NOT NULL, "remote_reference" text NOT NULL, "userId" bigint NOT NULL, "amount" numeric NOT NULL, "remark" text, "payment_request_id" bigint NOT NULL, "metadata" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_0da74fd072f27a5ef464f79977a" FOREIGN KEY ("payment_request_id") REFERENCES "payment_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_0da74fd072f27a5ef464f79977a"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TABLE "payment_requests"`);
        await queryRunner.query(`DROP TYPE "public"."payment_requests_status_enum"`);
    }

}
