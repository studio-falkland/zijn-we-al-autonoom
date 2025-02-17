import { MigrationInterface, QueryRunner } from "typeorm";

export class MeasurementAsCountryCode1738962782096 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE measurement ADD as_country_code text');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE measurement DROP as_country_code');
    }

}
