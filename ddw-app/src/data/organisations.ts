// Map-facing query: every active local organisation with coordinates.
import { Organisation, Region } from '@are-we-dependent/data';
import { IsNull, Not } from 'typeorm';

import { db, ensureDb } from './db';

// All local organisations that can be pinned to the map, coordinates only.
export async function getMapOrganisations(): Promise<Organisation[]> {
    await ensureDb();

    // Only the columns the map needs; classifications join just filters region.
    return db.getRepository(Organisation).find({
        where: {
            active: true,
            lat: Not(IsNull()),
            lng: Not(IsNull()),
            classifications: { region: Region.Local },
        },
        select: {
            slug: true,
            name: true,
            postcode: true,
            lat: true,
            lng: true,
        },
    });
}
