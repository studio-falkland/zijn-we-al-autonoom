import type { MigrationInterface, QueryRunner } from 'typeorm';

export class M1733492735586 implements MigrationInterface {
    name = 'M1733492735586';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "measurement_error" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "error" text NOT NULL,
                "stack" text NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ'))
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "measurement" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "type" text NOT NULL,
                "data" text NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ')),
                "url" text NOT NULL,
                "error" integer,
                CONSTRAINT "REL_63489fe2ac12ebe464b4ec7098" UNIQUE ("error")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "measurement"`);
        await queryRunner.query(`DROP TABLE "measurement_error"`);
    }
}
