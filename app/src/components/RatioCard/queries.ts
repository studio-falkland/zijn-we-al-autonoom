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
    category: string;
    sector?: string;
}

export async function getFrequencySet(config: FrequencyConfig): Promise<MeasurementFrequency[]> {
    return config.category === Category.DotNL
        ? await getAggregateFrequency(config)
        : await getMeasurementFrequency(config);
}

/**
 * Return the frequency of occurence of a particular AS organisation among a
 * distinct dataset, potentially consisting of a type, region, category and/or sector.
 */
export async function getMeasurementFrequency({ type, region, category, sector }: FrequencyConfig) {
    const latestMeasurementsQuery = db.manager
        .createQueryBuilder()
        .select([
            "id",
            "asn",
            "as_country_code",
            "as_organisation",
        ])
        .from((qb) => {
            let subQuery = qb
                .select([
                    "measurement.id AS id",
                    "measurement.asn AS asn",
                    "measurement.as_country_code AS as_country_code",
                    "measurement.as_organisation AS as_organisation",
                    "measurement.url",
                    "ROW_NUMBER() OVER (PARTITION BY measurement.url ORDER BY measurement.created_at DESC) AS rn",
                ])
                .from(Measurement, "measurement")
                .leftJoin("url", "url", "measurement.url = url.url")
                .leftJoin("organisation", "organisation", "url.organisation = organisation.slug")
                .leftJoin(
                    "organisation_classification",
                    "organisation_classification",
                    "organisation.slug = organisation_classification.organisation"
                );

            if (type) {
                subQuery = subQuery.andWhere("measurement.type = :type", { type });
            }
            if (region) {
                subQuery = subQuery.andWhere("organisation_classification.region = :region", { region });
            }
            if (category) {
                subQuery = subQuery.andWhere("organisation_classification.category = :category", { category });
            }
            if (sector) {
                subQuery = subQuery.andWhere("organisation_classification.sector = :sector", { sector });
            }

            return subQuery;
        }, "t")
        .where("t.rn = 1");

    const result = db.manager
        .createQueryBuilder()
        .select([
            "latestMeasurements.asn",
            "latestMeasurements.as_country_code",
            "latestMeasurements.as_organisation",
            "COUNT(*) AS frequency",
        ])
        // .addCommonTableExpression(latestMeasurementsQuery, 'latestMeasurements')
        .from(`(${latestMeasurementsQuery.getQuery()})`, "latestMeasurements")
        .setParameters(latestMeasurementsQuery.getParameters()) // Ensure all parameters are passed
        .where("latestMeasurements.asn IS NOT NULL")
        .groupBy("latestMeasurements.as_organisation")
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
