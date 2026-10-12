// Shared treemap layout, ported from the web app's useTreemapHierarchy.
// Framework-free so the Phase 2 print pipeline can reuse the same artwork.

import { hierarchy, treemap, treemapBinary } from 'd3';

import type { MeasurementFrequency } from '@/data/dependencies';

// Shares below this percentage are rolled into a single "Others" tile.
const MIN_PERCENTAGE = 5;

// A node datum: a frequency, or the root carrying children.
type TreemapDatum = MeasurementFrequency & { children?: TreemapDatum[] };

// The laid-out geometry of one treemap tile.
export type TreemapRect = {
    x: number;
    y: number;
    width: number;
    height: number;
    frequency: MeasurementFrequency;
};

// The "Others" roll-up tile: no AS attribution of its own. Its label comes from
// the caller (translated), so this module stays language-free.
const othersLeaf = (label: string): MeasurementFrequency => ({
    category: label,
    frequency: 0,
    ratio: 0,
    asn: null,
    as_country_code: null,
    as_organisation: null,
});

// Compute the treemap tiles for the given frequencies and dimensions.
export function buildTreemapLayout(
    frequencies: MeasurementFrequency[],
    width: number,
    height: number,
    othersLabel: string,
): TreemapRect[] {
    // Group the small shares into an "Others" accumulator, like the web app.
    const { main, other } = frequencies.reduce(
        (acc, frequency) => {
            if (frequency.ratio * 100 >= MIN_PERCENTAGE) {
                acc.main.push(frequency);
            } else {
                acc.other.frequency += frequency.frequency;
                acc.other.ratio += frequency.ratio;
            }
            return acc;
        },
        { main: [] as MeasurementFrequency[], other: othersLeaf(othersLabel) },
    );

    // Only append "Others" when it actually absorbed any frequencies.
    const leaves: TreemapDatum[] = other.frequency > 0 ? [...main, other] : main;
    if (leaves.length === 0) return [];

    // Lay the tree out with binary tiling and 4px gutters between tiles, but
    // no outer inset so the tile field aligns exactly with the card padding.
    const treemapRoot = treemap<TreemapDatum>()
        .tile(treemapBinary)
        .size([width, height])
        .paddingInner(4)
        .paddingOuter(0)(
        hierarchy<TreemapDatum>({
            category: 'root',
            frequency: 0,
            ratio: 0,
            asn: null,
            as_country_code: null,
            as_organisation: null,
            children: leaves,
        })
            .sum((datum) => datum.frequency || 0)
            .sort((a, b) => b.data.frequency - a.data.frequency),
    );

    // Project the d3 nodes into plain rects for the renderers.
    return treemapRoot.leaves().map((node) => ({
        x: node.x0,
        y: node.y0,
        width: node.x1 - node.x0,
        height: node.y1 - node.y0,
        frequency: node.data,
    }));
}
