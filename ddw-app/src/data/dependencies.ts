// Dependency breakdown for a selection: the combined web + email hosting
// footprint of the selected services. For every URL we take the latest
// measurement per dataset type (webhosting-as, email-as) and count each as one
// dependency instance of its AS organisation — the web app's per-dataset
// semantics, but with both hosting dimensions combined into one card.
// The grid operators and the drinkwater company have no stored rows, so their
// leaves come from the hardcoded table in ./utility-measurements instead.

import { DestinationDataset, Measurement, Organisation, URL } from '@are-we-dependent/data';
import { In } from 'typeorm';

import { db, ensureDb } from './db';
import type { SelectedService } from './services';
import { UTILITY_MEASUREMENTS } from './utility-measurements';

// One treemap leaf: an AS organisation (or the caller's unknown label) and its share.
export type MeasurementFrequency = {
    category: string;
    frequency: number;
    ratio: number;
    asn: number | null;
    as_country_code: string | null;
    as_organisation: string | null;
};

// The two hosting datasets that make up the personal visualization.
// Legacy types (webhost/mx) are excluded: they are older names for the same
// datasets and would double-count a URL's web or email dependency.
const DEPENDENCY_TYPES = [DestinationDataset.WebhostingAS, DestinationDataset.EmailAS];

// The stored rows a service's data may live on, and which service each belongs to.
type ServiceRows = {
    rowsByService: Map<string, string[]>;
    serviceByRow: Map<string, string>;
};

// The extraction can spread one organisation over several stored rows: the same
// name appearing again (in another source dataset, or as another branch) gets a
// "-1"/"-2" slug suffix, and the measurements may sit on a row other than the one
// the app selected. Group every row that shares a selected service's name, so the
// data is found wherever it was stored.
async function groupServiceRows(services: SelectedService[]): Promise<ServiceRows> {
    await ensureDb();
    const slugs = services.map((service) => service.slug);
    const names = [...new Set(services.map((service) => service.name))];

    // One query for both the selected rows (so a stored service is told apart
    // from a runtime provider, which has no row of its own) and same-name rows.
    const rows = names.length > 0
        ? await db.getRepository(Organisation).find({
            where: [{ slug: In(slugs) }, { name: In(names) }],
            select: { slug: true, name: true },
        })
        : [];

    const slugsByName = new Map<string, string[]>();
    for (const row of rows) {
        slugsByName.set(row.name, [...(slugsByName.get(row.name) ?? []), row.slug]);
    }

    // Only a stored service gets its same-name siblings; a runtime provider (the
    // grid operators, the water company) keeps its own slug and its hardcoded
    // measurements instead.
    const stored = new Set(rows.map((row) => row.slug));
    const result: ServiceRows = { rowsByService: new Map(), serviceByRow: new Map() };
    for (const service of services) {
        const serviceRows = stored.has(service.slug) ? slugsByName.get(service.name) ?? [] : [];
        result.rowsByService.set(service.slug, serviceRows.length > 0 ? serviceRows : [service.slug]);
        for (const slug of serviceRows) result.serviceByRow.set(slug, service.slug);
    }
    return result;
}

// The share of hosted URLs per AS organisation for the selected services.
export async function getDependencyFrequencies(
    services: SelectedService[],
    unknownLabel: string,
): Promise<MeasurementFrequency[]> {
    // Every stored row the selection's data may live on, siblings included.
    const { rowsByService } = await groupServiceRows(services);
    const slugs = [...new Set([...rowsByService.values()].flat())];
    if (slugs.length === 0) return [];

    // Load every URL of the selected organisations with only their web/email
    // hosting measurements.
    const urls = await db.getRepository(URL).find({
        where: {
            organisation: { slug: In(slugs) },
            measurements: { type: In(DEPENDENCY_TYPES) },
        },
        relations: { measurements: true },
    });

    // Keep only the most recent measurement per URL per dataset type.
    const latest = new Map<string, Measurement>();
    for (const url of urls) {
        for (const measurement of url.measurements ?? []) {
            const key = `${url.url}::${measurement.type}`;
            const previous = latest.get(key);
            if (!previous || new Date(measurement.created_at) > new Date(previous.created_at)) {
                latest.set(key, measurement);
            }
        }
    }

    // The hardcoded utility leaves join the measured instances; both carry the
    // same asn / as_organisation / as_country_code fields the loop reads.
    const utilities = services.flatMap((service) => utilityFrequencies(service) ?? []);

    // Count how often each AS organisation hosts one of the dependency instances.
    const counts = new Map<string, MeasurementFrequency>();
    let total = 0;
    for (const measurement of [...latest.values(), ...utilities]) {
        if (measurement.asn == null) continue; // unmeasured instances are excluded
        const label = measurement.as_organisation ?? unknownLabel;
        const entry = counts.get(label) ?? {
            category: label,
            frequency: 0,
            ratio: 0,
            asn: measurement.asn,
            as_country_code: measurement.as_country_code ?? null,
            as_organisation: measurement.as_organisation ?? null,
        };
        entry.frequency += 1;
        counts.set(label, entry);
        total += 1;
    }

    // Turn the counts into shares, largest first (treemap input order).
    return [...counts.values()]
        .map((entry) => ({ ...entry, ratio: entry.frequency / total }))
        .sort((a, b) => b.frequency - a.frequency);
}

// One service's own dependency breakdown: the latest measurement of each hosting
// dataset (webhosting-as, email-as), so each service card reveals its own email
// and web hosting providers rather than the combined footprint of the selection.
export type ServiceProviders = {
    service: SelectedService;
    frequencies: MeasurementFrequency[];
};

// Every selected service with its per-service providers, in the selection order.
// A service with no measured URLs still gets an entry, with an empty breakdown.
export async function getServiceProviders(
    services: SelectedService[],
    unknownLabel: string,
): Promise<ServiceProviders[]> {
    // Every stored row the selection's data may live on, siblings included.
    const { rowsByService, serviceByRow } = await groupServiceRows(services);
    const slugs = [...new Set([...rowsByService.values()].flat())];
    if (slugs.length === 0) return [];

    // Load every URL of the selection with its organisation and hosting measurements.
    const urls = await db.getRepository(URL).find({
        where: {
            organisation: { slug: In(slugs) },
            measurements: { type: In(DEPENDENCY_TYPES) },
        },
        relations: { measurements: true, organisation: true },
    });

    // Bucket each hosting measurement under the selected service that owns the
    // row the URL belongs to, so a sibling row still counts for its service.
    const bySlug = new Map<string, Measurement[]>();
    for (const url of urls) {
        const serviceSlug = serviceByRow.get(url.organisation?.slug ?? '');
        if (!serviceSlug) continue;
        const list = bySlug.get(serviceSlug) ?? [];
        for (const measurement of url.measurements ?? []) list.push(measurement);
        bySlug.set(serviceSlug, list);
    }

    // Per service: the hardcoded utility leaves where the provider has no row of
    // its own, otherwise the latest measurement per dataset type.
    return services.map((service) => ({
        service,
        frequencies: utilityFrequencies(service)
            ?? toServiceFrequencies(bySlug.get(service.slug) ?? [], unknownLabel),
    }));
}

// The hardcoded leaves for a utility provider (the grid operators and the
// drinkwater company), which have no organisation row of their own. A stored
// service has no entry here, so it keeps its measured frequencies instead.
function utilityFrequencies(service: SelectedService): MeasurementFrequency[] | null {
    const measurement = UTILITY_MEASUREMENTS[service.name];
    if (!measurement) return null;

    // Its two hosting datasets share the mosaic evenly, exactly like a stored
    // service's measured web + email pair.
    const leaves = [measurement.web, measurement.email];
    return leaves.map((leaf) => ({
        category: leaf.as_organisation,
        frequency: 1,
        ratio: 1 / leaves.length,
        asn: leaf.asn,
        as_country_code: leaf.as_country_code,
        as_organisation: leaf.as_organisation,
    }));
}

// The latest measurement of each hosting dataset type, as equal-share leaves.
function toServiceFrequencies(measurements: Measurement[], unknownLabel: string): MeasurementFrequency[] {
    // Keep only the most recent measurement per dataset type we measure.
    const latest = new Map<string, Measurement>();
    for (const measurement of measurements) {
        if (!DEPENDENCY_TYPES.includes(measurement.type)) continue;
        const previous = latest.get(measurement.type);
        if (!previous || new Date(measurement.created_at) > new Date(previous.created_at)) {
            latest.set(measurement.type, measurement);
        }
    }

    // Two providers (email + webhosting) share the mosaic evenly; one fills it.
    const leaves = [...latest.values()];
    return leaves.map((measurement) => ({
        category: measurement.as_organisation ?? unknownLabel,
        frequency: 1,
        ratio: leaves.length > 0 ? 1 / leaves.length : 0,
        asn: measurement.asn ?? null,
        as_country_code: measurement.as_country_code ?? null,
        as_organisation: measurement.as_organisation ?? null,
    }));
}
