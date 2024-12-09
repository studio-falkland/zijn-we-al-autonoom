import { MigrationInterface, QueryRunner } from 'typeorm';

export class M1733500559125 implements MigrationInterface {
    name = 'M1733500559125';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "organisation_classification" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, 
                "region" varchar NOT NULL, 
                "category" varchar NOT NULL, 
                "sector" varchar NOT NULL, 
                "organisation" text NOT NULL, 
                CONSTRAINT "UQ_396c52905498be537530d4a5a26" UNIQUE ("organisation", "region", "category")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "organisation_classification"`);
    }
}
