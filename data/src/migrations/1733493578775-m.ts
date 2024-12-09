import { MigrationInterface, QueryRunner } from 'typeorm';

export class M1733493578775 implements MigrationInterface {
    name = 'M1733493578775';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "dataset" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" text NOT NULL,
                "source" text NOT NULL,
                "cacheKey" text NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ')),
                "updated_at" datetime NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ')),
                CONSTRAINT "UQ_109fd11edd246e0465d2e7e76a1" UNIQUE ("name")
            )
        `);
        await queryRunner.query(`
            CREATE TRIGGER datasetUpdate AFTER UPDATE ON dataset
            BEGIN
            update dataset SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ') WHERE id = NEW.id;
            END
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "dataset"`);
    }
}
