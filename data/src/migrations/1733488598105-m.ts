import { MigrationInterface,
    QueryRunner } from 'typeorm';

export class M1733488598105 implements MigrationInterface {
    name = 'M1733488598105';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "organisation" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" text NOT NULL,
                "slug" text NOT NULL,
                "dataset" text NOT NULL,
                "address" text,
                "city" text,
                "postcode" text,
                "lat" float,
                "lng" float,
                "active" boolean NOT NULL DEFAULT (1),
                "created_at" datetime NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ')),
                "updated_at" datetime NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ')),
                CONSTRAINT "UQ_b800a0efd2f9f19719d0c4d793d" UNIQUE ("slug")
            )
        `);
        await queryRunner.query(`
            CREATE TRIGGER organisationUpdate AFTER UPDATE ON organisation
            BEGIN
            update organisation SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ') WHERE id = NEW.id;
            END
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "organisation"`);
    }
}
