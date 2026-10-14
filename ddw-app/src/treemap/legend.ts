// The legend shown at the top of the dependency sheet: the largest providers and
// their share. Framework-free so the print HTML and the on-screen preview agree.

import { isUSFrequency, PatternId } from '@/components/treemap/patternDefs';
import type { MeasurementFrequency } from '@/data/dependencies';

// One legend row: the provider, its whole-percent share, and how it is drawn.
export type LegendEntry = {
    category: string;
    percent: number;
    us: boolean;
    patternId: string;
};

// How many providers the legend lists.
const LEGEND_SIZE = 3;

// The largest providers, matching the treemap's own ordering (frequencies arrive
// largest first). The "Others" roll-up is not a frequency, so it never appears.
export function buildLegend(frequencies: MeasurementFrequency[]): LegendEntry[] {
    return frequencies.slice(0, LEGEND_SIZE).map((frequency) => ({
        category: frequency.category,
        percent: Math.round(frequency.ratio * 100),
        us: isUSFrequency(frequency),
        patternId: PatternId(frequency),
    }));
}
