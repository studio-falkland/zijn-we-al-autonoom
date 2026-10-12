// Dependency breakdown for a selection: the combined web + email hosting
// footprint of the selected services. For every URL we take the latest
// measurement per dataset type (webhosting-as, email-as) and count each as one
// dependency instance of its AS organisation — the web app's per-dataset
// semantics, but with both hosting dimensions combined into one card.

import { DestinationDataset, Measurement, URL } from '@are-we-dependent/data';
import { In } from 'typeorm';

import { db, ensureDb } from './db';
import type { SelectedService } from './services';

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

// The share of hosted URLs per AS organisation for the selected services.
export async function getDependencyFrequencies(
    services: SelectedService[],
    unknownLabel: string,
): Promise<MeasurementFrequency[]> {
    await ensureDb();
    const slugs = services.map((service) => service.slug);
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

    // Count how often each AS organisation hosts one of the dependency instances.
    const counts = new Map<string, MeasurementFrequency>();
    let total = 0;
    for (const measurement of latest.values()) {
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
    await ensureDb();
    const slugs = services.map((service) => service.slug);
    if (slugs.length === 0) return [];

    // Load every URL of the selection with its organisation and hosting measurements.
    const urls = await db.getRepository(URL).find({
        where: {
            organisation: { slug: In(slugs) },
            measurements: { type: In(DEPENDENCY_TYPES) },
        },
        relations: { measurements: true, organisation: true },
    });

    // Bucket each hosting measurement under its URL's organisation slug.
    const bySlug = new Map<string, Measurement[]>();
    for (const url of urls) {
        const slug = url.organisation?.slug;
        if (!slug) continue;
        const list = bySlug.get(slug) ?? [];
        for (const measurement of url.measurements ?? []) list.push(measurement);
        bySlug.set(slug, list);
    }

    // Per service: the single latest measurement per dataset type, as its leaves.
    return services.map((service) => ({
        service,
        frequencies: toServiceFrequencies(bySlug.get(service.slug) ?? [], unknownLabel),
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
