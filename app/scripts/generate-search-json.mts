// scripts/generate-search-json.ts
import { writeFile } from 'fs/promises';
import db, { DestinationDataset } from '@are-we-dependent/data';

export interface RawQueryResult {
    organisation_id: number;
    organisation_name: string;
    organisation_slug: string;
    organisation_city?: string;
    organisation_address?: string;
    organisation_lat?: number;
    organisation_lng?: number;
    url_url?: string;
    measurement_type?: DestinationDataset;
    measurement_data?: string;
    measurement_as_organisation?: string;
    measurement_as_country_code?: string;
    measurement_asn?: number;
    classification_category?: string;
    classification_sector?: string;
}

export interface SearchMeasurement {
    url: string;
    data: string;
    as_organisation: string;
    as_country_code: string;
    asn?: number;
}

export interface SearchOrganisation {
    id: number;
    name: string;
    slug: string;
    city?: string;
    address?: string;
    coordinates?: [number, number];
    searchText: string;
    measurements: {
        'email-as': SearchMeasurement[];
        'webhosting-as': SearchMeasurement[];
        'webhosting-ip': SearchMeasurement[];
    };
    classifications: Array<{
        category: string;
        sector: string;
    }>;
}

export interface SearchData {
    metadata: {
        total_organizations: number;
        generated_at: string;
        datasets: DestinationDataset[];
    };
    organizations: SearchOrganisation[];
}

async function generateOptimizedSearchJSON(): Promise<void> {
    await db.initialize();

    console.log('Generating optimized search JSON...');

    // Create subquery for latest measurements (following your pattern)
    const latestMeasurementsSubquery = db.manager
        .createQueryBuilder()
        .select([
            'measurement.url as url',
            'measurement.type as type',
            'measurement.data as data',
            'measurement.as_organisation as as_organisation',
            'measurement.as_country_code as as_country_code',
            'measurement.asn as asn',
            'ROW_NUMBER() OVER (PARTITION BY measurement.url, measurement.type ORDER BY measurement.created_at DESC) as rn'
        ])
        .from('measurement', 'measurement')
        .where('measurement.type IN (:...types)', {
            types: [DestinationDataset.EmailAS, DestinationDataset.WebhostingAS]
        });

    // Main query following your existing patterns
    const query = db.manager
        .createQueryBuilder()
        .select([
            'organisation.id as organisation_id',
            'organisation.name as organisation_name',
            'organisation.slug as organisation_slug',
            'organisation.city as organisation_city',
            'organisation.address as organisation_address',
            'organisation.lat as organisation_lat',
            'organisation.lng as organisation_lng',
            'url.url as url_url',
            'latest_measurements.type as measurement_type',
            'latest_measurements.data as measurement_data',
            'latest_measurements.as_organisation as measurement_as_organisation',
            'latest_measurements.as_country_code as measurement_as_country_code',
            'latest_measurements.asn as measurement_asn',
            'classifications.category as classification_category',
            'classifications.sector as classification_sector'
        ])
        .from('organisation', 'organisation')
        .leftJoin('url', 'url', 'organisation.slug = url.organisation')
        .leftJoin(
            `(${latestMeasurementsSubquery.getQuery()})`,
            'latest_measurements',
            'url.url = latest_measurements.url AND latest_measurements.rn = 1'
        )
        .leftJoin('organisation_classification', 'classifications', 'organisation.slug = classifications.organisation')
        .setParameters(latestMeasurementsSubquery.getParameters())
        .where('organisation.active = :active', { active: true })
        .orderBy('organisation.name COLLATE NOCASE', 'ASC');

    const rawResults: RawQueryResult[] = await query.getRawMany();

    // Group by organization to create structured data (following your mapping pattern)
    const organizationsMap = new Map<number, SearchOrganisation>();

    rawResults.forEach((row: RawQueryResult) => {
        if (!organizationsMap.has(row.organisation_id)) {
            organizationsMap.set(row.organisation_id, {
                id: row.organisation_id,
                name: row.organisation_name,
                slug: row.organisation_slug,
                city: row.organisation_city,
                address: row.organisation_address,
                coordinates: row.organisation_lat && row.organisation_lng
                    ? [row.organisation_lat, row.organisation_lng]
                    : undefined,
                searchText: `${row.organisation_name} ${row.organisation_city || ''} ${row.organisation_address || ''}`.toLowerCase(),
                measurements: {
                    [DestinationDataset.EmailAS]: [],
                    [DestinationDataset.WebhostingAS]: [],
                    [DestinationDataset.WebhostingIP]: []
                },
                classifications: []
            });
        }

        const org = organizationsMap.get(row.organisation_id)!;

        // Add measurement if it exists
        if (row.measurement_type && row.url_url && row.measurement_data) {
            const measurement: SearchMeasurement = {
                url: row.url_url,
                data: row.measurement_data,
                as_organisation: row.measurement_as_organisation || '',
                as_country_code: row.measurement_as_country_code || '',
                asn: row.measurement_asn
            };

            org.measurements[row.measurement_type].push(measurement);
        }

        // Add classification if it exists and not already added
        if (row.classification_category && !org.classifications.some(c =>
            c.category === row.classification_category && c.sector === row.classification_sector
        )) {
            org.classifications.push({
                category: row.classification_category,
                sector: row.classification_sector || ''
            });
        }
    });

    // Filter organizations that have at least one measurement
    const organizations = Array.from(organizationsMap.values())
        .filter((org: SearchOrganisation) =>
            org.measurements[DestinationDataset.EmailAS].length > 0 ||
            org.measurements[DestinationDataset.WebhostingAS].length > 0 ||
            org.measurements[DestinationDataset.WebhostingIP].length > 0
        );

    // Create search data structure
    const searchData: SearchData = {
        metadata: {
            total_organizations: organizations.length,
            generated_at: new Date().toISOString(),
            datasets: [DestinationDataset.EmailAS, DestinationDataset.WebhostingAS, DestinationDataset.WebhostingIP]
        },
        organizations: organizations
    };

    // Write full version
    const jsonString = JSON.stringify(searchData, null, 2);
    await writeFile('./search-data.json', jsonString);

    // Calculate file size
    const fileSizeBytes = Buffer.byteLength(jsonString, 'utf8');
    const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);

    console.log(`✅ Generated search data:`);
    console.log(`   - Organizations with measurements: ${organizations.length}`);
    console.log(`   - File size: ${fileSizeMB} MB`);
    console.log(`   - Average per organization: ${Math.round(fileSizeBytes / organizations.length)} bytes`);

    await db.destroy();
}

export default generateOptimizedSearchJSON;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    generateOptimizedSearchJSON().catch(console.error);
}