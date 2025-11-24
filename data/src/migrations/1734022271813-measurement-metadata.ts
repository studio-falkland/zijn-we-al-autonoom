import type { MigrationInterface, QueryRunner } from "typeorm";

export class MeasurementMetadata1734022271813 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE measurement ADD ip TEXT');
        await queryRunner.query('ALTER TABLE measurement ADD domain_name TEXT');
        await queryRunner.query('ALTER TABLE measurement ADD asn INT');
        await queryRunner.query('ALTER TABLE measurement ADD as_organisation TEXT');
        await queryRunner.query('ALTER TABLE measurement ADD country_code TEXT');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE measurement DROP ip');
        await queryRunner.query('ALTER TABLE measurement DROP domain_name');
        await queryRunner.query('ALTER TABLE measurement DROP asn');
        await queryRunner.query('ALTER TABLE measurement DROP as_organisation');
        await queryRunner.query('ALTER TABLE measurement DROP country_code');
    }
}
