// Shared geometry, type and ink for the two A7 cards.
// Framework-free, so the print HTML builders and the on-screen previews derive
// the same layout from one place: the personal map card and the dependency sheet
// both put a header at the top and their artwork below it.

// A7 in the artwork's own units, and in millimetres. The printed SVG is sized in
// mm so it fills the A7 page regardless of the renderer's CSS pixel density.
export const A7_WIDTH = 210;
export const A7_HEIGHT = 298;
export const A7_WIDTH_MM = 74;
export const A7_HEIGHT_MM = 105;

// One millimetre at 72 PPI.
export const MM = 72 / 25.4;

// The map card's navy border sits 4 mm inside the page edge on all sides.
export const PAGE_PADDING = 4 * MM;

// The map card's content sits one padding inside the border; the borderless
// dependency sheet's content sits at the page padding instead.
export const PADDING = 12;

// The header type rhythm, measured from the content box top. The legend rows and
// the navy rule share the same band, so the header height is fixed.
export const TITLE_TOP = 12; // title baseline
export const SUBTITLE_TOP = 28; // subtitle baseline
export const RULE_TOP = 40; // the rule below the header
export const BODY_TOP = 50; // where the artwork starts

// Type sizes, shared by both cards.
export const TITLE_FONT_SIZE = 16;
export const SUBTITLE_FONT_SIZE = 10;
export const LABEL_FONT_SIZE = 10;

// The largest tile's label plate: its height (also the print line-height), the
// fraction of the tile width it may span, and the padding inside it.
export const PLATE_HEIGHT = 26;
export const PLATE_WIDTH_RATIO = 0.8;
export const PLATE_PADDING = 10;

// The legend band, in the header's top-right: three rows, right-aligned.
export const LEGEND_WIDTH = 80;
export const LEGEND_ROW_HEIGHT = 11;
export const LEGEND_FIRST_BASELINE = 11;
export const LEGEND_SWATCH = 7;
export const LEGEND_PERCENT_WIDTH = 20;
export const LEGEND_FONT_SIZE = 9;

// The card's frame geometry and ink.
export const CARD_BODY_RADIUS = 16;
export const CARD_RADIUS = 15;
export const SHADOW_OFFSET = 4;
export const INK = '#000066';
export const CARD_BORDER = '#0000AD';
export const CARD_SHADOW = '#0000A1';

// The light panel behind the map on the personal card.
export const PANEL = '#F1F1F8';

// The namespace the inlined SVG carries so `<mask url(#..)>` links resolve.
export const SVG_NS = 'xmlns="http://www.w3.org/2000/svg"';

// Escape text inserted into the inlined SVG (XML context) — screen renderers do
// this automatically; the raw strings here do not.
export function escapeXml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// The header and body offsets, shared by both layouts.
function cardBands(content: { x: number; y: number; width: number; height: number }) {
    return {
        titleY: content.y + TITLE_TOP,
        subtitleY: content.y + SUBTITLE_TOP,
        ruleY: content.y + RULE_TOP,
        body: { x: content.x, y: content.y + BODY_TOP, width: content.width, height: content.height - BODY_TOP },
    };
}

// The personal map card: a navy border at the page padding, content inside it.
export function cardLayout(width: number, height: number) {
    const border = {
        x: PAGE_PADDING,
        y: PAGE_PADDING,
        width: width - PAGE_PADDING * 2,
        height: height - PAGE_PADDING * 2,
    };
    const content = {
        x: border.x + PADDING,
        y: border.y + PADDING,
        width: border.width - PADDING * 2,
        height: border.height - PADDING * 2,
    };
    return { border, content, ...cardBands(content) };
}

// The dependency sheet: no border or shadow, content at the page padding.
export function sheetLayout(width: number, height: number) {
    const content = {
        x: PAGE_PADDING,
        y: PAGE_PADDING,
        width: width - PAGE_PADDING * 2,
        height: height - PAGE_PADDING * 2,
    };
    return { content, ...cardBands(content) };
}

// The map card's frame as inline SVG: the white body, the border's hard offset
// shadow, and the white border plate. The navy stroke is separate (below) so the
// caller can draw it last, on top of the panel and the art.
export function cardFrameSvg(width: number, height: number): string {
    const border = cardLayout(width, height).border;
    return (
        `<rect width="${width}" height="${height}" rx="${CARD_BODY_RADIUS}" fill="#FFFFFF"/>` +
        `<rect x="${border.x + SHADOW_OFFSET}" y="${border.y + SHADOW_OFFSET}" width="${border.width}" height="${border.height}" rx="${CARD_RADIUS}" fill="${CARD_SHADOW}"/>` +
        `<rect x="${border.x}" y="${border.y}" width="${border.width}" height="${border.height}" rx="${CARD_RADIUS}" fill="#FFFFFF"/>`
    );
}

// The navy border stroke, drawn last so the full-bleed panel never erodes it.
export function cardBorderSvg(width: number, height: number): string {
    const border = cardLayout(width, height).border;
    return `<rect x="${border.x}" y="${border.y}" width="${border.width}" height="${border.height}" rx="${CARD_RADIUS}" fill="none" stroke="${CARD_BORDER}" stroke-width="2"/>`;
}
