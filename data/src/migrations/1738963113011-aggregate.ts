import type { MigrationInterface, QueryRunner } from "typeorm";

export class Aggregate1738963113011 implements MigrationInterface {
    name = 'Aggregate1738963113011'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "aggregate" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "type" text NOT NULL,
                "label" text NOT NULL,
                "fraction" real NOT NULL,
                "quantity" integer NOT NULL,
                "date" date,
                "asn" integer,
                "as_organisation" text,
                "as_country_code" text,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                UNIQUE("type", "label", "date")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "aggregate"`);
    }

}
