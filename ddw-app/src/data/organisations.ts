// Map-facing query: every active local organisation with coordinates.
import { Category, GovernmentSector, Organisation, Region } from '@are-we-dependent/data';
import { In, IsNull, Not } from 'typeorm';

import { db, ensureDb } from './db';
import { GOVERNMENT_SERVICE_SLUGS } from './government-services';

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

// The location-bound providers we measure: the visitor's municipality and their
// water authority. A field is null when its name matches no organisation.
export type LocationProviders = {
    municipality: Organisation | null;
    waterschap: Organisation | null;
};

// Strip the leading type word and case, so PDOK and RIO names compare equal:
// PDOK says "Waterschap Amstel, Gooi en Vecht", the database "Amstel, Gooi en
// Vecht"; "Hoogheemraadschap van Rijnland" reduces to "rijnland" on both sides.
function normaliseProviderName(name: string): string {
    return name
        .toLowerCase()
        .replace(/^(gemeente|waterschap|hoogheemraadschap)\s+/, '')
        .replace(/^van\s+/, '')
        .trim();
}

// Every active local organisation of one government sector, for name matching.
async function getLocalSectorOrganisations(sector: GovernmentSector): Promise<Organisation[]> {
    await ensureDb();

    // The classification join narrows to the sector; relations load the rows.
    return db.getRepository(Organisation).find({
        where: { active: true, classifications: { region: Region.Local, sector } },
        relations: { classifications: true },
    });
}

// Every local organisation in a category, nearest to the visitor first — the
// pool a category step pins on the map. All of them are loaded, regardless of
// the `active` flag; MapLibre culls to the viewport and settles label
// collisions (the nearest features sort first, so they win those collisions).
export async function getCategoryOrganisations(
    center: [number, number],
    category: Category,
): Promise<Organisation[]> {
    await ensureDb();
    const [lng, lat] = center;

    const organisations = await db.getRepository(Organisation).find({
        where: {
            classifications: { region: Region.Local, category },
        },
        relations: { classifications: true },
    });

    // Squared distance to the visitor is enough to order the results.
    const distance = (organisation: Organisation) =>
        ((organisation.lat ?? lat) - lat) ** 2 + ((organisation.lng ?? lng) - lng) ** 2;

    return organisations.sort((a, b) => distance(a) - distance(b));
}

// The predefined national government services, as stored rows. Membership and
// order come from the constant; the names and classifications from the rows.
export async function getGovernmentServices(): Promise<Organisation[]> {
    await ensureDb();

    const organisations = await db.getRepository(Organisation).find({
        where: { active: true, slug: In(GOVERNMENT_SERVICE_SLUGS) },
        relations: { classifications: true },
    });

    // Order the rows back into the constant's order, so the grid is stable.
    const order = new Map(GOVERNMENT_SERVICE_SLUGS.map((slug, index) => [slug, index]));
    return organisations.sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
}

// Match a looked-up name to a local organisation of one sector, with a contains
// fallback for small registry spelling differences.
async function matchLocalOrganisation(
    sector: GovernmentSector,
    name?: string,
): Promise<Organisation | null> {
    if (!name) return null;
    const target = normaliseProviderName(name);
    if (!target) return null;

    const organisations = await getLocalSectorOrganisations(sector);
    return (
        organisations.find((org) => normaliseProviderName(org.name) === target) ??
        organisations.find((org) => normaliseProviderName(org.name).includes(target)) ??
        null
    );
}

// The municipality pin nearest to a point. Used when the PDOK lookup did not
// resolve a name (an offline fallback location), so the locked-in step still
// knows which municipality the visitor answers to. Null when none has
// coordinates.
async function getNearestMunicipality(center: [number, number]): Promise<Organisation | null> {
    const [lng, lat] = center;
    const municipalities = await getLocalSectorOrganisations(GovernmentSector.Municipality);

    let nearest: Organisation | null = null;
    let best = Infinity;
    for (const org of municipalities) {
        if (org.lat == null || org.lng == null) continue;
        const distance = (org.lat - lat) ** 2 + (org.lng - lng) ** 2;
        if (distance < best) {
            best = distance;
            nearest = org;
        }
    }
    return nearest;
}

// Resolve the visitor's municipality and water authority. The municipality comes
// from the PDOK name, or — when that name is missing (an offline fallback
// location) — from the nearest local municipality pin to the visitor's point.
// The water authority comes from the utility lookup. Names are matched with the
// type word stripped.
export async function getLocationProviders(names: {
    gemeente?: string;
    waterschap?: string;
    center?: [number, number];
}): Promise<LocationProviders> {
    const municipality = names.gemeente
        ? await matchLocalOrganisation(GovernmentSector.Municipality, names.gemeente)
        : names.center
          ? await getNearestMunicipality(names.center)
          : null;

    const waterschap = await matchLocalOrganisation(GovernmentSector.WaterBoard, names.waterschap);
    return { municipality, waterschap };
}
