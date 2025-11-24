import type { MigrationInterface, QueryRunner } from "typeorm";

export class Indexes1740397478530 implements MigrationInterface {
    name = 'Indexes1740397478530'

    public async up(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query(`CREATE INDEX idx_measurement_url_created_at ON measurement(url, created_at DESC)`);
        queryRunner.query(`CREATE INDEX idx_measurement_type_created_at ON measurement (type, created_at DESC)`);
        queryRunner.query(`CREATE INDEX idx_measurement_asn ON measurement(asn)`);
        queryRunner.query(`CREATE INDEX idx_url_organisation ON url (organisation)`);
        queryRunner.query(`CREATE INDEX idx_org_class_region_category_sector ON organisation_classification (organisation, region, category, sector)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        //
    }

}
