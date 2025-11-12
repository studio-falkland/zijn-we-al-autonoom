import db, { Measurement } from '@are-we-dependent/data';

/**
 * Retrieve the latest update date of the measurements.
 */
export async function getLatestUpdateDate() {
    const query = db.manager.getRepository(Measurement)
        .createQueryBuilder('measurement')
        .select("MAX(measurement.created_at)", "latestDate")

    return query.getRawOne() as Promise<{ latestDate: string }>;
}
