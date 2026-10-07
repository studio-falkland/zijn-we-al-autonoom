// Dependency breakdown for a selection: latest measurement per URL, aggregated
// by AS organisation, matching the web app's treemap input shape.
import { Measurement, Organisation, URL } from '@are-we-dependent/data';
import { In } from 'typeorm';

import { db, ensureDb } from './db';

// One treemap leaf: an AS organisation (or "Onbekend") and its share.
export type MeasurementFrequency = {
    category: string;
    frequency: number;
    ratio: number;
    asn: number | null;
    as_country_code: string | null;
    as_organisation: string | null;
};

// The share of hosted URLs per AS organisation for the selected services.
export async function getDependencyFrequencies(
    services: Organisation[],
): Promise<MeasurementFrequency[]> {
    await ensureDb();
    const slugs = services.map((service) => service.slug);
    if (slugs.length === 0) return [];

    // Load every URL of the selected organisations with their measurements.
    const urls = await db.getRepository(URL).find({
        where: { organisation: { slug: In(slugs) } },
        relations: { measurements: true },
    });

    // Keep only the most recent measurement per URL.
    const latest = new Map<string, Measurement>();
    for (const url of urls) {
        for (const measurement of url.measurements ?? []) {
            const previous = latest.get(url.url);
            if (!previous || new Date(measurement.created_at) > new Date(previous.created_at)) {
                latest.set(url.url, measurement);
            }
        }
    }

    // Count how often each AS organisation hosts one of the selected URLs.
    const counts = new Map<string, MeasurementFrequency>();
    let total = 0;
    for (const measurement of latest.values()) {
        if (measurement.asn == null) continue; // unmeasured URLs are excluded
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
