import { MigrationInterface,
    QueryRunner } from 'typeorm';

export class M1733490131937 implements MigrationInterface {
    name = 'M1733490131937';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "url" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "url" text NOT NULL,
                "alive" boolean NOT NULL DEFAULT (1),
                "created_at" datetime NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ')),
                "updated_at" datetime NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ')),
                "organisation" text NOT NULL,
                CONSTRAINT "UQ_b9ada929131b184dcf4ce79cf1a" UNIQUE ("url"),
                CONSTRAINT "FK_38a517b563e3b07f3b51e0c7a35" FOREIGN KEY ("organisation") REFERENCES "organisation" ("slug") ON DELETE NO ACTION ON UPDATE NO ACTION
            )`,
        );
        await queryRunner.query(`
            CREATE TRIGGER urlUpdate AFTER UPDATE ON url
            BEGIN
            update url SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ') WHERE id = NEW.id;
            END
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "url"`);
    }
}
