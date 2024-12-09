import { MigrationInterface, QueryRunner } from 'typeorm';

export class Pragma1733487496374 implements MigrationInterface {
    transaction = false;

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`PRAGMA foreign_keys = ON`);
        await queryRunner.query(`PRAGMA journal_mode = 'wal'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }
}
