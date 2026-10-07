// Map-facing query: every active local organisation with coordinates.
import { GovernmentSector, Organisation, Region } from '@are-we-dependent/data';
import { IsNull, Not } from 'typeorm';

import { db, ensureDb } from './db';

// All local organisations that can be pinned to the map, coordinates only.
// Sector is loaded so the map can prioritise some providers' labels.
export async function getMapOrganisations(): Promise<Organisation[]> {
    await ensureDb();

    // Only the columns the map needs; classifications join just filters region.
    // Sector must be loaded via `relations` — selecting relation columns alone
    // silently returns no classifications in TypeORM 1.x.
    return db.getRepository(Organisation).find({
        where: {
            active: true,
            lat: Not(IsNull()),
            lng: Not(IsNull()),
            classifications: { region: Region.Local },
        },
        relations: { classifications: true },
        select: {
            slug: true,
            name: true,
            postcode: true,
            lat: true,
            lng: true,
        },
    });
}

// Sort key for the map's label placement: features with a LOWER value are
// placed first, so they win the collision fight. Municipalities always come
// first (see symbol-sort-key in the MapLibre style spec).
export function mapSortKey(organisations: Pick<Organisation, 'classifications'>): number {
    const isMunicipality = organisations.classifications?.some(
        (c) => c.sector === GovernmentSector.Municipality,
    );
    return isMunicipality ? 0 : 1;
}

// The city for a postcode area, for the personalised card subtitle.
export async function getPlaceName(postcode: string): Promise<string | null> {
    await ensureDb();

    // Any active local organisation in the area carries its place name.
    const organisation = await db.getRepository(Organisation).findOne({
        where: { postcode, active: true, city: Not(IsNull()) },
        select: { city: true },
    });
    return organisation?.city ?? null;
}
