// Dependency breakdown for a selection: the combined web + email hosting
// footprint of the selected services. For every URL we take the latest
// measurement per dataset type (webhosting-as, email-as) and count each as one
// dependency instance of its AS organisation — the web app's per-dataset
// semantics, but with both hosting dimensions combined into one card.

import { DestinationDataset, Measurement, URL } from '@are-we-dependent/data';
import { In } from 'typeorm';

import { db, ensureDb } from './db';
import type { SelectedService } from './services';

// One treemap leaf: an AS organisation (or "Onbekend") and its share.
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
        const label = measurement.as_organisation ?? 'Onbekend';
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
