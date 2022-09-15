import type { MigrationInterface, QueryRunner } from "typeorm";

export class initial1663251768332 implements MigrationInterface {
    name = 'initial1663251768332'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "purchase_item" ("id" SERIAL NOT NULL, "item_id" integer NOT NULL, "purchase_id" integer NOT NULL, "unit_price" numeric(10,2) NOT NULL, "price" numeric(10,2) NOT NULL, "discount_amount" numeric(10,2) NOT NULL DEFAULT '0', "quantity" bigint NOT NULL, CONSTRAINT "CHK_fabd520db6ae34b80503443aa2" CHECK ("price" >= 0 and "unit_price" >=0), CONSTRAINT "CHK_60c15ccd3390f40e65cd5f2d6c" CHECK ("quantity" >= 0), CONSTRAINT "CHK_083f6f61198e07ae9eb1696e39" CHECK ("discount_amount" >= 0.00), CONSTRAINT "PK_e7e6cd38bb62fd147ab2f91f656" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."purchase_status_enum" AS ENUM('pending', 'paid', 'canceled')`);
        await queryRunner.query(`CREATE TABLE "purchase" ("id" SERIAL NOT NULL, "discount_id" integer, "chat_id" integer, "shop_id" integer NOT NULL, "status" "public"."purchase_status_enum" NOT NULL DEFAULT 'pending', "total" numeric(10,2) NOT NULL, "discount_amount" numeric(10,2) NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_0366387c9b83cecfd3ec3c24f6" CHECK ("discount_amount" >= 0), CONSTRAINT "CHK_078431f1090ef5cc3b2ea5d041" CHECK ("total" >= 0), CONSTRAINT "PK_86cc2ebeb9e17fc9c0774b05f69" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "discount" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "amount" numeric(5,4) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_18f0b4dadf3a872e1688ceb7fa3" UNIQUE ("title"), CONSTRAINT "CHK_b95f304ee35cfc4bb23ef7d32c" CHECK ("amount" >= 0.00 and "amount" <= 1.00), CONSTRAINT "PK_d05d8712e429673e459e7f1cddb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "discount_item_group" ("id" SERIAL NOT NULL, "item_group_id" integer NOT NULL, "discount_id" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_7b4ff5ce7039c98722e5243dcf1" UNIQUE ("item_group_id", "discount_id"), CONSTRAINT "PK_c7f1b2fc7d83a9de62d1c78b409" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "item" ("id" SERIAL NOT NULL, "item_group_id" integer NOT NULL, "title" character varying NOT NULL, "image_id" character varying, "price" numeric(10,2) NOT NULL, "unit_price" numeric(10,2) NOT NULL, "quantity" bigint NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_f99b7fb5be612ce9e5e92e6574d" UNIQUE ("title", "item_group_id"), CONSTRAINT "CHK_e78951045ee137aeaa9ca9b2c1" CHECK ("price" >= 0 and "unit_price" >=0 and "unit_price" < "price"), CONSTRAINT "CHK_2941115f23db2f8fac36836b3f" CHECK ("quantity" >= 0), CONSTRAINT "PK_d3c0c71f23e7adcf952a1d13423" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "item_group" ("id" SERIAL NOT NULL, "chat_id" integer, "shop_id" integer NOT NULL, "title" character varying NOT NULL, "deleted" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_258868dd844a6df3f2e7858f098" UNIQUE ("title", "shop_id"), CONSTRAINT "PK_6b0100c5cb7c67d99ae46197727" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "shop" ("id" SERIAL NOT NULL, "owner_chat_id" integer NOT NULL, "title" character varying NOT NULL, "is_published" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "shop_id" integer, CONSTRAINT "UQ_013b6bd05dada0dd45ee07ff5a2" UNIQUE ("owner_chat_id"), CONSTRAINT "PK_ad47b7c6121fe31cb4b05438e44" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."chat_type_enum" AS ENUM('private', 'group')`);
        await queryRunner.query(`CREATE TYPE "public"."chat_chat_group_type_enum" AS ENUM('error', 'admin', 'superadmin')`);
        await queryRunner.query(`CREATE TABLE "chat" ("id" SERIAL NOT NULL, "telegram_chat_id" bigint NOT NULL, "name" character varying NOT NULL, "type" "public"."chat_type_enum" NOT NULL, "chat_group_type" "public"."chat_chat_group_type_enum", "verified" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_025820db46d97a48d77b966036e" UNIQUE ("telegram_chat_id"), CONSTRAINT "UQ_4df83e99ea23bd2f12793453498" UNIQUE ("chat_group_type"), CONSTRAINT "PK_9d0b2ba74336710fd31154738a5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4df83e99ea23bd2f1279345349" ON "chat" ("chat_group_type") `);
        await queryRunner.query(`CREATE TYPE "public"."feedback_type_enum" AS ENUM('general', 'error', 'suggestion', 'new-feature')`);
        await queryRunner.query(`CREATE TABLE "feedback" ("id" SERIAL NOT NULL, "chat_id" bigint NOT NULL, "message" text NOT NULL, "type" "public"."feedback_type_enum" NOT NULL DEFAULT 'general', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8389f9e087a57689cd5be8b2b13" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_22d52bb865c8d21c0e7cb6204e" ON "feedback" ("type") `);
        await queryRunner.query(`ALTER TABLE "purchase_item" ADD CONSTRAINT "FK_350d9b7c4792561317ca3a37e1d" FOREIGN KEY ("purchase_id") REFERENCES "purchase"("id") ON DELETE CASCADE ON UPDATE NO ACTION DEFERRABLE INITIALLY DEFERRED`);
        await queryRunner.query(`ALTER TABLE "purchase_item" ADD CONSTRAINT "FK_f9592b4d9cbd724fc0bc322350e" FOREIGN KEY ("item_id") REFERENCES "purchase"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchase" ADD CONSTRAINT "FK_28342c92bd8f9fab0d8a4ace329" FOREIGN KEY ("discount_id") REFERENCES "discount"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "discount_item_group" ADD CONSTRAINT "FK_dc83b854a9f73ed3a7d0b359eef" FOREIGN KEY ("item_group_id") REFERENCES "item_group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "discount_item_group" ADD CONSTRAINT "FK_8a6bdcd2de12ce5e2eeef9111d8" FOREIGN KEY ("discount_id") REFERENCES "discount"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "item" ADD CONSTRAINT "FK_0aaff10eef9f837947e6a9691d8" FOREIGN KEY ("item_group_id") REFERENCES "item_group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "item_group" ADD CONSTRAINT "FK_f789125519f6762983f472ae645" FOREIGN KEY ("shop_id") REFERENCES "shop"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shop" ADD CONSTRAINT "FK_6f653444db79f1204beff6a9113" FOREIGN KEY ("shop_id") REFERENCES "chat"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shop" DROP CONSTRAINT "FK_6f653444db79f1204beff6a9113"`);
        await queryRunner.query(`ALTER TABLE "item_group" DROP CONSTRAINT "FK_f789125519f6762983f472ae645"`);
        await queryRunner.query(`ALTER TABLE "item" DROP CONSTRAINT "FK_0aaff10eef9f837947e6a9691d8"`);
        await queryRunner.query(`ALTER TABLE "discount_item_group" DROP CONSTRAINT "FK_8a6bdcd2de12ce5e2eeef9111d8"`);
        await queryRunner.query(`ALTER TABLE "discount_item_group" DROP CONSTRAINT "FK_dc83b854a9f73ed3a7d0b359eef"`);
        await queryRunner.query(`ALTER TABLE "purchase" DROP CONSTRAINT "FK_28342c92bd8f9fab0d8a4ace329"`);
        await queryRunner.query(`ALTER TABLE "purchase_item" DROP CONSTRAINT "FK_f9592b4d9cbd724fc0bc322350e"`);
        await queryRunner.query(`ALTER TABLE "purchase_item" DROP CONSTRAINT "FK_350d9b7c4792561317ca3a37e1d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_22d52bb865c8d21c0e7cb6204e"`);
        await queryRunner.query(`DROP TABLE "feedback"`);
        await queryRunner.query(`DROP TYPE "public"."feedback_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4df83e99ea23bd2f1279345349"`);
        await queryRunner.query(`DROP TABLE "chat"`);
        await queryRunner.query(`DROP TYPE "public"."chat_chat_group_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."chat_type_enum"`);
        await queryRunner.query(`DROP TABLE "shop"`);
        await queryRunner.query(`DROP TABLE "item_group"`);
        await queryRunner.query(`DROP TABLE "item"`);
        await queryRunner.query(`DROP TABLE "discount_item_group"`);
        await queryRunner.query(`DROP TABLE "discount"`);
        await queryRunner.query(`DROP TABLE "purchase"`);
        await queryRunner.query(`DROP TYPE "public"."purchase_status_enum"`);
        await queryRunner.query(`DROP TABLE "purchase_item"`);
    }

}
