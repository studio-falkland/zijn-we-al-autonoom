import { Aggregate, Category, Measurement } from '@are-we-dependent/data';
import db from '@/lib/db';
import { Frequency } from '@/lib/hhi';

export type MeasurementFrequency = Pick<
    Measurement,
    'asn' | 'as_country_code' | 'as_organisation'
> & { frequency: number } & Frequency;

export interface FrequencyConfig {
    type?: string;
    region?: string;
    category?: string;
    sector?: string;
    groupBy?: 'as_organisation' | 'asn' | 'as_country_code';
    includeUnmeasured?: boolean;
}

export async function getFrequencySet(config: FrequencyConfig): Promise<MeasurementFrequency[]> {
    return config.category === Category.DotNL
        ? await getAggregateFrequency(config)
        : await getMeasurementFrequency(config);
}

/**
 * Return the frequency of occurence of a particular AS organisation among a
 * distinct dataset, potentially consisting of a type, region, category and/or sector.
 * Can optionally include unmeasured organizations.
 */
export async function getMeasurementFrequency({ type, region, category, sector, groupBy, includeUnmeasured = false }: FrequencyConfig) {
    // Always start from organizations - this is more comprehensive
    let orgQuery = db.manager
        .createQueryBuilder()
        .select([
            "organisation.slug AS org_slug",
            "organisation.name AS org_name",
            "url.url AS url"
        ])
        .from("organisation", "organisation")
        .leftJoin("url", "url", "organisation.slug = url.organisation")
        .leftJoin(
            "organisation_classification",
            "organisation_classification",
            "organisation.slug = organisation_classification.organisation"
        );

    if (region) {
        orgQuery = orgQuery.andWhere("organisation_classification.region = :region", { region });
    }
    if (category) {
        orgQuery = orgQuery.andWhere("organisation_classification.category = :category", { category });
    }
    if (sector) {
        orgQuery = orgQuery.andWhere("organisation_classification.sector = :sector", { sector });
    }

    // Subquery for latest measurements per URL
    let latestMeasurementsSubquery = db.manager
        .createQueryBuilder()
        .select([
            "measurement.id AS id",
            "measurement.asn AS asn",
            "measurement.as_country_code AS as_country_code", 
            "measurement.as_organisation AS as_organisation",
            "measurement.url AS url",
            "ROW_NUMBER() OVER (PARTITION BY measurement.url ORDER BY measurement.created_at DESC) AS rn"
        ])
        .from(Measurement, "measurement");
    
    if (type) {
        latestMeasurementsSubquery = latestMeasurementsSubquery.andWhere("measurement.type = :type", { type });
    }

    // Join organizations with their latest measurements
    const orgWithMeasurementsQuery = db.manager
        .createQueryBuilder()
        .select([
            "orgs.org_slug",
            "orgs.org_name",
            "orgs.url",
            "latest_measurements.asn",
            "latest_measurements.as_country_code",
            "latest_measurements.as_organisation"
        ])
        .from(`(${orgQuery.getQuery()})`, "orgs")
        .leftJoin(
            `(${latestMeasurementsSubquery.getQuery()})`,
            "latest_measurements",
            "orgs.url = latest_measurements.url AND latest_measurements.rn = 1"
        )
        .setParameters({
            ...orgQuery.getParameters(),
            ...latestMeasurementsSubquery.getParameters()
        });

    // Determine the grouping field and handle unmeasured organizations
    const groupByField = groupBy || 'as_organisation';
    let selectField;
    let unmeasuredLabel;
    
    switch(groupByField) {
        case 'asn':
            selectField = "org_measurements.asn";
            unmeasuredLabel = "NULL";
            break;
        case 'as_country_code':
            selectField = "org_measurements.as_country_code";
            unmeasuredLabel = "Onbekend";
            break;
        default:
            selectField = "org_measurements.as_organisation";
            unmeasuredLabel = "Onbekend";
    }

    let result = db.manager
        .createQueryBuilder()
        .select([
            `COALESCE(${selectField}, '${unmeasuredLabel}') AS ${groupByField}`,
            `COALESCE(org_measurements.asn, NULL) AS asn`,
            `COALESCE(org_measurements.as_country_code, NULL) AS as_country_code`,
            `COALESCE(org_measurements.as_organisation, '${unmeasuredLabel}') AS as_organisation`,
            "COUNT(*) AS frequency"
        ])
        .from(`(${orgWithMeasurementsQuery.getQuery()})`, "org_measurements")
        .setParameters(orgWithMeasurementsQuery.getParameters());

    // Filter out unmeasured organizations if not requested
    if (!includeUnmeasured) {
        result = result.where("org_measurements.asn IS NOT NULL");
    }

    result = result
        .groupBy(`COALESCE(${selectField}, '${unmeasuredLabel}')`)
        .orderBy("frequency", "DESC");

    // Retrieve all frequencies
    const frequencies = (await result.getRawMany()) as MeasurementFrequency[];

    // Calculate the sum of all returned frequencies
    const sum = frequencies.reduce((sum, f) => sum + f.frequency, 0);

    // Use that to calculate ratios
    return frequencies.map((f) => ({
        ...f,
        category: f.as_organisation!,
        ratio: f.frequency / sum,
    })) as MeasurementFrequency[];
}

/**
 * Retrieve the latest aggregate records for a particular type.
 */
export async function getAggregateFrequency({ type }: FrequencyConfig) {
    const subQuery = db.getRepository(Aggregate)
        .createQueryBuilder('aggregate')
        .select("MAX(date)", "latestDate")
        .where("aggregate.type = :type", { type });

    const query = db.manager.getRepository(Aggregate)
        .createQueryBuilder('aggregate')
        .select([
            "type",
            "label AS category",
            "quantity AS frequency",
            "fraction AS ratio",
            "asn",
            "as_organisation",
            "as_country_code",
        ])
        .where('aggregate.type = :type', { type })
        .andWhere(`aggregate.date = (${subQuery.getQuery()})`)
        .setParameters(subQuery.getParameters()) // Ensure parameters are correctly passed

    return query.getRawMany() as Promise<MeasurementFrequency[]>;
}
