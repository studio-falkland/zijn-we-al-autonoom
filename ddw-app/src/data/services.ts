// Services per zipcode area: active local organisations in the same postcode prefix.
import { Organisation, Region } from '@are-we-dependent/data';
import { Like, type FindManyOptions } from 'typeorm';
import { db, ensureDb } from './db';

// Query local services whose postcode starts with the zipcode's 4 digits.
export async function getServicesByZipcode(zipcode: string): Promise<Organisation[]> {
    await ensureDb();
    const digits = zipcode.replace(/\D/g, '').slice(0, 4);
    if (digits.length < 4) return [];

    // Filter active local organisations to the postcode area and local region.
    const options: FindManyOptions<Organisation> = {
        where: {
            active: true,
            postcode: Like(`${digits}%`),
            classifications: { region: Region.Local },
        },
    };

    // Load the matches with their classifications, ordered by name.
    return db
        .getRepository(Organisation)
        .find({ ...options, relations: { classifications: true }, order: { name: 'ASC' } });
}
