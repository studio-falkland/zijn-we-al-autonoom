// Map-facing query: every active local organisation with coordinates.
import { Category, GovernmentSector, Organisation, Region } from '@are-we-dependent/data';
import { Between, In, IsNull, Not } from 'typeorm';

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

// The box (degrees) and cap for a category's local providers: roughly the fixed
// map viewport, so the pins stay legible.
const CATEGORY_SPAN = 0.15;
const CATEGORY_LIMIT = 40;

// Active local organisations in a category within a box around the visitor,
// nearest first — the pool a category step pins on the map.
export async function getCategoryOrganisations(
    center: [number, number],
    category: Category,
): Promise<Organisation[]> {
    await ensureDb();
    const [lng, lat] = center;

    const organisations = await db.getRepository(Organisation).find({
        where: {
            active: true,
            lat: Between(lat - CATEGORY_SPAN, lat + CATEGORY_SPAN),
            lng: Between(lng - CATEGORY_SPAN, lng + CATEGORY_SPAN),
            classifications: { region: Region.Local, category },
        },
        relations: { classifications: true },
    });

    // Squared distance to the visitor is enough to order the results.
    const distance = (organisation: Organisation) =>
        ((organisation.lat ?? lat) - lat) ** 2 + ((organisation.lng ?? lng) - lng) ** 2;

    return organisations.sort((a, b) => distance(a) - distance(b)).slice(0, CATEGORY_LIMIT);
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

// Resolve the visitor's municipality and water authority. Both names come from
// their location: the municipality from the PDOK document, the water authority
// from the utility lookup. Names are matched with the type word stripped.
export async function getLocationProviders(names: {
    gemeente?: string;
    waterschap?: string;
}): Promise<LocationProviders> {
    const [municipalities, waterschappen] = await Promise.all([
        names.gemeente ? getLocalSectorOrganisations(GovernmentSector.Municipality) : [],
        names.waterschap ? getLocalSectorOrganisations(GovernmentSector.WaterBoard) : [],
    ]);

    // The first organisation whose normalised name matches the looked-up name,
    // with a contains fallback for small registry spelling differences.
    const match = (organisations: Organisation[], name?: string) => {
        if (!name) return null;
        const target = normaliseProviderName(name);
        if (!target) return null;
        return (
            organisations.find((org) => normaliseProviderName(org.name) === target) ??
            organisations.find((org) => normaliseProviderName(org.name).includes(target)) ??
            null
        );
    };

    return {
        municipality: match(municipalities, names.gemeente),
        waterschap: match(waterschappen, names.waterschap),
    };
}
