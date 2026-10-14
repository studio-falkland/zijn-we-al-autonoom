// Builds the dependency sheet as inline SVG for the print document.
// The sheet has no frame or shadow: just the header (title, the visitor's city
// and the provider legend), the navy rule, and the treemap mosaic. It reuses the
// shared treemap layout and the single source of truth for the artwork.

import { isUSFrequency, PatternMatcher, patternDefs, renderPatternDefsSvg, scaledPatternDef } from '@/components/treemap/patternDefs';
import type { MeasurementFrequency } from '@/data/dependencies';
import { translate, type Language } from '@/i18n';
import { buildTreemapLayout } from '@/treemap/layout';
import { frequencyLabelName, truncateLabel } from '@/treemap/label';
import { buildLegend, type LegendEntry } from '@/treemap/legend';

import { FAMILIEN_GROTESK_400_BASE64, FAMILIEN_GROTESK_700_BASE64 } from './fontsBase64';
import {
    A7_HEIGHT,
    A7_HEIGHT_MM,
    A7_WIDTH,
    A7_WIDTH_MM,
    INK,
    LEGEND_FIRST_BASELINE,
    LEGEND_FONT_SIZE,
    LEGEND_PERCENT_WIDTH,
    LEGEND_ROW_HEIGHT,
    LEGEND_SWATCH,
    LEGEND_WIDTH,
    PLATE_HEIGHT,
    PLATE_WIDTH_RATIO,
    SUBTITLE_FONT_SIZE,
    SVG_NS,
    TITLE_FONT_SIZE,
    escapeXml,
    sheetLayout,
} from './geometry';

export { A7_WIDTH, A7_HEIGHT } from './geometry';

// The leaf fills: red for US-hosted dependencies, blue for everything else.
const LEAF_BLUE = '#0000FF';
const LEAF_RED = '#FF0000';
const LEAF_BASE = '#FFFFFF';

// The printed patterns read too large beside the on-screen ones, so the print
// document renders every pattern at half the on-screen size.
const PRINT_PATTERN_SCALE = 0.5;
const PRINT_SCALE_OVERRIDES: Record<string, number> = Object.fromEntries(
    patternDefs.map((def) => [def.id, PRINT_PATTERN_SCALE]),
);

// Visitor context that personalises the header.
export type CardContext = {
    place: string | null;
    language: Language;
};

// One mosaic tile: light base, patterned fill, and the self-measuring label.
// Only the largest provider gets a label, and it is the name only.
function tileToSvg(rect: { x: number; y: number; width: number; height: number; frequency: MeasurementFrequency }, label: string | null): string {
    const us = isUSFrequency(rect.frequency);
    const mask = PatternMatcher(rect.frequency);

    // The label plate is capped at a fraction of the tile width, centred; the
    // browser measures and ellipsises the text inside the foreignObject, so no
    // text width is hardcoded here.
    const plateWidth = rect.width * PLATE_WIDTH_RATIO;
    const plateX = rect.x + (rect.width - plateWidth) / 2;
    const plateY = rect.y + rect.height / 2 - PLATE_HEIGHT / 2;
    const plate =
        label !== null && plateWidth > 0 && rect.height > PLATE_HEIGHT
            ? `<foreignObject x="${plateX}" y="${plateY}" width="${plateWidth}" height="${PLATE_HEIGHT}">` +
              `<div xmlns="http://www.w3.org/1999/xhtml" class="plate">${escapeXml(label)}</div>` +
              `</foreignObject>`
            : '';

    return (
        `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="4" fill="${LEAF_BASE}"/>` +
        `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="4" fill="${us ? LEAF_RED : LEAF_BLUE}" mask="${mask}"/>` +
        `${plate}`
    );
}

// One legend swatch: the pattern drawn directly, as a small tiling of its tile.
// The mask+pattern route reads as a solid block at this size in WebKit's print,
// so the motif's own paths are emitted instead, clipped to the swatch.
function legendSwatchToSvg(entry: LegendEntry, index: number, x: number, y: number): string {
    const tint = entry.us ? LEAF_RED : LEAF_BLUE;
    const plate = `<rect x="${x}" y="${y}" width="${LEGEND_SWATCH}" height="${LEGEND_SWATCH}" rx="2" fill="${LEAF_BASE}"/>`;
    const def = patternDefs.find((pattern) => pattern.id === entry.patternId);
    if (!def) return plate + `<rect x="${x}" y="${y}" width="${LEGEND_SWATCH}" height="${LEGEND_SWATCH}" rx="2" fill="${tint}"/>`;

    const tile = scaledPatternDef(def, PRINT_PATTERN_SCALE);
    // The hatches tile densely; a logo reads best as a single motif.
    const hatched = tile.paths.every((path) => path.stroke !== undefined);
    const scale = LEGEND_SWATCH / ((hatched ? 3 : 1) * Math.max(tile.width, tile.height));
    const cols = Math.ceil(LEGEND_SWATCH / (tile.width * scale));
    const rows = Math.ceil(LEGEND_SWATCH / (tile.height * scale));

    const paths = tile.paths
        .map((path) =>
            path.stroke !== undefined
                ? `<path d="${path.d}" fill="none" stroke="${tint}" stroke-width="${1 / scale}"/>`
                : `<path d="${path.d}" fill="${tint}"${path.fillRule ? ' fill-rule="evenodd"' : ''}/>`,
        )
        .join('');

    let motif = '';
    for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
            motif += `<g transform="translate(${col * tile.width} ${row * tile.height})">${paths}</g>`;
        }
    }

    return (
        plate +
        `<clipPath id="legend-swatch-${index}"><rect x="${x}" y="${y}" width="${LEGEND_SWATCH}" height="${LEGEND_SWATCH}" rx="2"/></clipPath>` +
        // The clip is referenced by an untransformed group so it stays in root
        // coordinates; the motif is scaled inside it.
        `<g clip-path="url(#legend-swatch-${index})"><g transform="translate(${x} ${y}) scale(${scale})">${motif}</g></g>`
    );
}

// One legend row: the patterned swatch, the provider name, and its share.
function legendRowToSvg(entry: LegendEntry, index: number, content: { x: number; width: number; y: number }): string {
    const right = content.x + content.width;
    const left = right - LEGEND_WIDTH;
    const baseline = content.y + LEGEND_FIRST_BASELINE + index * LEGEND_ROW_HEIGHT;
    const nameWidth = LEGEND_WIDTH - LEGEND_SWATCH - 5 - LEGEND_PERCENT_WIDTH;
    const name = truncateLabel(entry.category, nameWidth, LEGEND_FONT_SIZE);

    return (
        legendSwatchToSvg(entry, index, left, baseline - LEGEND_SWATCH + 1) +
        `<text x="${left + LEGEND_SWATCH + 5}" y="${baseline}" font-family="Familjen Grotesk" font-size="${LEGEND_FONT_SIZE}" fill="${INK}">${escapeXml(name)}</text>` +
        `<text x="${right}" y="${baseline}" font-family="Familjen Grotesk" font-size="${LEGEND_FONT_SIZE}" fill="${INK}" text-anchor="end">${entry.percent}%</text>`
    );
}

// The two Familjen Grotesk faces inlined for the print document.
export function cardFontFaces(): string {
    return (
        `@font-face{font-family:'Familjen Grotesk';font-weight:400;font-style:normal;` +
        `src:url(data:font/woff2;base64,${FAMILIEN_GROTESK_400_BASE64}) format('woff2')}` +
        `@font-face{font-family:'Familjen Grotesk';font-weight:700;font-style:normal;` +
        `src:url(data:font/woff2;base64,${FAMILIEN_GROTESK_700_BASE64}) format('woff2')}`
    );
}

// The dependency sheet as one inline SVG: the header (title, the visitor's city
// and the provider legend), the navy rule, then the treemap mosaic.
export function buildDependencySheetSvg(frequencies: MeasurementFrequency[], context: CardContext): string {
    const { content, body, titleY, subtitleY, ruleY } = sheetLayout(A7_WIDTH, A7_HEIGHT);
    const { language } = context;

    // The mosaic is laid out in its own region, then shifted into the sheet.
    const tiles = buildTreemapLayout(frequencies, body.width, body.height, translate(language, 'card.others'))
        .map((rect, index) =>
            tileToSvg(
                { ...rect, x: rect.x + body.x, y: rect.y + body.y },
                index === 0 ? frequencyLabelName(rect.frequency) : null,
            ),
        )
        .join('');

    // The legend rows, top-right, in the header band.
    const legend = buildLegend(frequencies)
        .map((entry, index) => legendRowToSvg(entry, index, content))
        .join('');

    // The personalised copy: title and the visitor's place.
    const title = translate(language, 'card.visitorTitle');
    const place = context.place ?? translate(language, 'card.yourNeighbourhood');
    const subtitle = translate(language, 'card.livesIn', { place });

    return (
        `<svg ${SVG_NS} width="${A7_WIDTH_MM}mm" height="${A7_HEIGHT_MM}mm" viewBox="0 0 ${A7_WIDTH} ${A7_HEIGHT}">` +
        `<defs>${renderPatternDefsSvg(PRINT_SCALE_OVERRIDES)}</defs>` +
        // Header: title and the visitor's place on the left, the legend on the right.
        `<text x="${content.x}" y="${titleY}" font-family="Familjen Grotesk" font-size="${TITLE_FONT_SIZE}" font-weight="700" fill="${INK}">${escapeXml(title)}</text>` +
        `<text x="${content.x}" y="${subtitleY}" font-family="Familjen Grotesk" font-size="${SUBTITLE_FONT_SIZE}" font-weight="400" fill="${INK}">${escapeXml(subtitle)}</text>` +
        `${legend}` +
        `<line x1="${content.x}" y1="${ruleY}" x2="${content.x + content.width}" y2="${ruleY}" stroke="${INK}"/>` +
        // The treemap mosaic, filling the space the header leaves over.
        `${tiles}` +
        `</svg>`
    );
}
