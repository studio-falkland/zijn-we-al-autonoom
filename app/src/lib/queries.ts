import { Dataset, Measurement, DestinationDataset, Category, URL, Organisation, OrganisationClassification } from '@are-we-dependent/data';
import db from '@/lib/db';

export type LatestMeasurementResult = Pick<URL, 'id' | 'url'> & {
    organisation: Pick<Organisation, 'name' | 'lat' | 'lng'> & {
        classifications: Pick<OrganisationClassification, 'category' | 'sector'>[];
    };
    measurements: Pick<Measurement, 'data' | 'as_organisation' | 'as_country_code' | 'asn'>[];
};

/**
 * Retrieve the latest update date of the measurements.
 */
export async function getLatestUpdateDate() {
    const query = db.manager.getRepository(Measurement)
        .createQueryBuilder('measurement')
        .select("MAX(measurement.created_at)", "latestDate")

    return query.getRawOne() as Promise<{ latestDate: string }>;
}

/**
 * Retrieve the datasets used in the project.
 */
export async function getDatasets() {
    const query = db.manager.getRepository(Dataset)
        .createQueryBuilder('dataset')
        .select('*')
    return query.getRawMany() as Promise<Dataset[]>;
}

/**
 * Get latest measurements for a specific dataset type and optional category
 */
export async function getLatestMeasurements(
    type: DestinationDataset, 
    category?: Category,
    options?: { requireCoordinates?: boolean }
): Promise<LatestMeasurementResult[]> {
    const subquery = db.manager
        .createQueryBuilder()
        .select([
            'measurement.url as url',
            'measurement.data as data',
            'measurement.as_organisation as as_organisation',
            'measurement.as_country_code as as_country_code',
            'measurement.asn as asn',
            'measurement.id as id',
            'ROW_NUMBER() OVER (PARTITION BY measurement.url ORDER BY measurement.created_at DESC) as rn'
        ])
        .from('measurement', 'measurement')
        .where('measurement.type = :type', { type });

    let query = db.manager
        .createQueryBuilder()
        .select([
            'url.id as id',
            'url.url as url',
            'organisation.name as organisation_name',
            'organisation.lat as organisation_lat',
            'organisation.lng as organisation_lng',
            'latest_measurements.data as measurements_data',
            'latest_measurements.as_organisation as measurements_as_organisation',
            'classifications.category as classifications_category',
            'classifications.sector as classifications_sector'
        ])
        .from('url', 'url')
        .leftJoin('organisation', 'organisation', 'url.organisation = organisation.slug')
        .leftJoin('organisation_classification', 'classifications', 'organisation.slug = classifications.organisation')
        .leftJoin(
            `(${subquery.getQuery()})`,
            'latest_measurements',
            'url.url = latest_measurements.url AND latest_measurements.rn = 1'
        )
        .setParameters(subquery.getParameters())
        .where('latest_measurements.as_organisation IS NOT NULL');

    if (options?.requireCoordinates) {
        query = query.andWhere('organisation.lat IS NOT NULL')
                    .andWhere('organisation.lng IS NOT NULL');
    }

    if (category) {
        query = query.andWhere('classifications.category = :category', { category });
    }

    const rawResults = await query.getRawMany();

    return rawResults.map(row => ({
        id: row.id,
        url: row.url,
        organisation: {
            name: row.organisation_name,
            lat: row.organisation_lat,
            lng: row.organisation_lng,
            classifications: [{
                category: row.classifications_category,
                sector: row.classifications_sector
            }]
        },
        measurements: [{
            data: row.measurements_data,
            as_organisation: row.measurements_as_organisation,
            as_country_code: row.measurements_as_country_code,
            asn: row.measurements_asn
        }]
    })) as LatestMeasurementResult[];
}
