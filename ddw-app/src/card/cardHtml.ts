// Builds the A7 print document as a self-contained HTML string.
// Reuses the shared treemap layout and the single source of truth for the
// artwork (patternDefs.ts), so the printed card and the on-screen preview are
// the same composition. Everything is inlined: the vector SVG (never rasterized)
// and the Familjen Grotesk WOFF2 faces as base64 @font-face.

import { isUSFrequency, PatternMatcher, renderPatternDefsSvg } from '@/components/treemap/patternDefs';
import type { MeasurementFrequency } from '@/data/dependencies';
import { translate, type Language } from '@/i18n';
import { buildTreemapLayout, type TreemapRect } from '@/treemap/layout';
import { frequencyLabelName, truncateLabel } from '@/treemap/label';

import { FAMILIEN_GROTESK_400_BASE64, FAMILIEN_GROTESK_700_BASE64 } from './fontsBase64';

// A7 at 72 PPI: 74×105 mm ≈ 210×298 px. The page and the SVG share these.
export const A7_WIDTH = 210;
export const A7_HEIGHT = 298;

// The leaf fills: red for US-hosted dependencies, blue for everything else.
const LEAF_BLUE = '#0000FF';
const LEAF_RED = '#FF0000';
const LEAF_BASE = '#FFFFFF';

// The card's ink and frame colours.
const INK = '#000066';
const CARD_BORDER = '#0000AD';

// The plate behind the largest tile's name, matching the screen plate.
const LABEL_PLATE = '#FFFFFF';
const LABEL_FONT_SIZE = 14;

// The hard offset shadow the border casts, matching the screen's Shadows.box.
const CARD_SHADOW = '#0000A1';
const SHADOW_OFFSET = 4;

// The Amazon arrows print a touch large, so the printed card scales that one
// motif down below its on-screen size (0.8 × 0.85).
const PRINT_SCALE_OVERRIDES: Record<string, number> = { 'zwaa-amazon': 0.85 };

// Card layout: two constants, everything else is derived from them and the
// page size, so the mosaic always fills the space the header leaves over.
const MARGIN = 10; // space between the page edge and the navy border
const PADDING = 12; // space between the navy border and the card content

// The header type rhythm, measured from the content box top.
const TITLE_TOP = 12; // title baseline
const SUBTITLE_TOP = 28; // subtitle baseline

// The mosaic follows the text with the same padding.
const MOSAIC_TOP = SUBTITLE_TOP + PADDING + 8;

// Visitor context that personalises the header.
export type CardContext = {
    place: string | null;
    language: Language;
};

// Namespace prefix used by the inlined SVG so `<mask url(#..)>` links resolve.
const SVG_NS = 'xmlns="http://www.w3.org/2000/svg"';

// Escape text inserted into the inlined SVG (XML context) — screen renderers
// do this automatically; the raw string here does not.
function escapeXml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// One mosaic tile: light base, patterned fill, and the clipped label plate.
// Only the largest provider gets a label, and it is the name only.
function tileToSvg(rect: TreemapRect, index: number, label: string | null): string {
    const us = isUSFrequency(rect.frequency);
    const mask = PatternMatcher(rect.frequency);
    // The label plate: spans the tile, white, with the name centred and
    // truncated to fit so it never exceeds the background.
    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;
    const plateX = rect.x + 16;
    const plateY = centerY - 12;
    const plateWidth = rect.width - 32;
    const fittedLabel = label ? truncateLabel(label, plateWidth - 8, LABEL_FONT_SIZE) : null;
    const plate = fittedLabel
        ? `<clipPath id="plate-${index}"><rect x="${plateX}" y="${plateY}" width="${plateWidth}" height="24" rx="4"/></clipPath>` +
          `<rect x="${plateX}" y="${plateY}" width="${plateWidth}" height="24" rx="4" fill="${LABEL_PLATE}" clip-path="url(#clip-${index})"/>`
        : '';
    const text = fittedLabel
        ? `<text x="${centerX}" y="${centerY + 4}" font-family="Familjen Grotesk" font-size="${LABEL_FONT_SIZE}" font-weight="400" fill="${INK}" text-anchor="middle" clip-path="url(#plate-${index})">${escapeXml(fittedLabel)}</text>`
        : '';
    return (
        `<clipPath id="clip-${index}"><rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}"/></clipPath>` +
        `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="4" fill="${LEAF_BASE}"/>` +
        `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="4" fill="${us ? LEAF_RED : LEAF_BLUE}" mask="${mask}"/>` +
        `${plate}${text}`
    );
}

// All positions, derived from the page size and the layout constants.
function cardLayout(width: number, height: number) {
    // The navy border sits inside the page by one margin.
    const border = { x: MARGIN, y: MARGIN, width: width - MARGIN * 2, height: height - MARGIN * 2 };

    // The content box sits inside the border by one padding.
    const content = {
        x: border.x + PADDING,
        y: border.y + PADDING,
        width: border.width - PADDING * 2,
        height: border.height - PADDING * 2,
    };

    // The header rhythm, then the mosaic fills the remaining content.
    const mosaic = {
        x: content.x,
        y: content.y + MOSAIC_TOP,
        width: content.width,
        height: content.height - MOSAIC_TOP,
    };

    return {
        border,
        content,
        titleY: content.y + TITLE_TOP,
        subtitleY: content.y + SUBTITLE_TOP,
        mosaic,
    };
}

// The two Familjen Grotesk faces inlined for the print document.
function fontFaces(): string {
    return (
        `@font-face{font-family:'Familjen Grotesk';font-weight:400;font-style:normal;` +
        `src:url(data:font/woff2;base64,${FAMILIEN_GROTESK_400_BASE64}) format('woff2')}` +
        `@font-face{font-family:'Familjen Grotesk';font-weight:700;font-style:normal;` +
        `src:url(data:font/woff2;base64,${FAMILIEN_GROTESK_700_BASE64}) format('woff2')}`
    );
}

// The full A7 card document: header and the dependency mosaic.
export function buildCardHtml(frequencies: MeasurementFrequency[], context: CardContext): string {
    const { border, content, titleY, subtitleY, mosaic } = cardLayout(A7_WIDTH, A7_HEIGHT);
    const { language } = context;

    // The mosaic is laid out in its own region, then shifted into the card.
    const tiles = buildTreemapLayout(frequencies, mosaic.width, mosaic.height, translate(language, 'card.others'))
        .map((rect, index) =>
            tileToSvg(
                { ...rect, x: rect.x + mosaic.x, y: rect.y + mosaic.y },
                index,
                index === 0 ? frequencyLabelName(rect.frequency) : null,
            ),
        )
        .join('');

    // The personalised copy: title and the visitor's place.
    const title = translate(language, 'card.visitorTitle');
    const place = context.place ?? translate(language, 'card.yourNeighbourhood');
    const subtitle = translate(language, 'card.livesIn', { place });

    return (
        `<!doctype html><html lang="${language}"><head><meta charset="utf-8"/>` +
        `<style>html,body{margin:0;padding:0}${fontFaces()}svg{display:block}</style>` +
        `</head><body>` +
        `<svg ${SVG_NS} width="${A7_WIDTH}" height="${A7_HEIGHT}" viewBox="0 0 ${A7_WIDTH} ${A7_HEIGHT}">` +
        `<defs>${renderPatternDefsSvg(PRINT_SCALE_OVERRIDES)}</defs>` +
        // Card body, the border's hard offset shadow, and the navy border.
        `<rect width="${A7_WIDTH}" height="${A7_HEIGHT}" rx="16" fill="#FFFFFF"/>` +
        `<rect x="${border.x + SHADOW_OFFSET}" y="${border.y + SHADOW_OFFSET}" width="${border.width}" height="${border.height}" rx="15" fill="${CARD_SHADOW}"/>` +
        `<rect x="${border.x}" y="${border.y}" width="${border.width}" height="${border.height}" rx="15" fill="#FFFFFF"/>` +
        `<rect x="${border.x}" y="${border.y}" width="${border.width}" height="${border.height}" rx="15" fill="none" stroke="${CARD_BORDER}" stroke-width="2"/>` +
        // Header: title and the visitor's place, then the navy rule.
        `<text x="${content.x}" y="${titleY}" font-family="Familjen Grotesk" font-size="18" font-weight="700" fill="${INK}">${escapeXml(title)}</text>` +
        `<text x="${content.x}" y="${subtitleY}" font-family="Familjen Grotesk" font-size="12" font-weight="400" fill="${INK}">${escapeXml(subtitle)}</text>` +
        `<line x1="${border.x}" y1="${subtitleY + 11}" x2="${border.x + border.width}" y2="${subtitleY + 11}" stroke="${INK}"/>` +
        // The treemap mosaic, filling the space the header leaves over.
        `${tiles}` +
        `</svg></body></html>`
    );
}
