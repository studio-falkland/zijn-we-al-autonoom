import { Dataset, Measurement } from '@are-we-dependent/data';
import db from '@/lib/db';

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