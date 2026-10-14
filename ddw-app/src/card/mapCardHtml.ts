// Builds the personal map card as inline SVG for the print document.
// The header carries the visitor's city; below it a light panel holds the
// pixelated Netherlands artwork with a dot at the visitor's location and a line
// pointing to the visitor figure — an indication of where the sheet is pinned.

import { translate, type Language } from '@/i18n';

import { A7_HEIGHT, A7_HEIGHT_MM, A7_WIDTH, A7_WIDTH_MM, CARD_BORDER, CARD_RADIUS, INK, PANEL, SUBTITLE_FONT_SIZE, SVG_NS, TITLE_FONT_SIZE, cardBorderSvg, cardFrameSvg, cardLayout, escapeXml } from './geometry';
import { MAP_ART_HEIGHT, MAP_ART_WIDTH, MAP_PATHS, MAP_SHADOW_DEFS, PERSON_PATHS, PERSON_VIEWBOX } from './mapArt';

// Visitor context for the personal card: the city and the chosen point.
export type MapCardContext = {
    place: string | null;
    center: [number, number] | null; // [longitude, latitude]
    language: Language;
};

// The Netherlands' WGS84 bounding box, mapped linearly onto the artwork's box.
// The pixel map is stylised, so a plain linear fit is enough to land the dot in
// the right part of the country — the indication need not be geographically exact.
const NL_BOUNDS = { minLng: 3.36, maxLng: 7.23, minLat: 50.75, maxLat: 53.55 };

// The space kept around the artwork and the figure inside the panel.
const PANEL_INSET = 16;

// The visitor figure's height in px; its width follows the icon's aspect.
const PERSON_HEIGHT = 66;

// The marker ink: the dot, the line and the figure.
const MARKER = CARD_BORDER;

// Clamp a value into a range, so a point outside the country stays on the art.
function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

// Project [lng, lat] onto the artwork's 0..56 / 0..67 box.
function project(center: [number, number]): { x: number; y: number } {
    const lng = clamp(center[0], NL_BOUNDS.minLng, NL_BOUNDS.maxLng);
    const lat = clamp(center[1], NL_BOUNDS.minLat, NL_BOUNDS.maxLat);
    return {
        x: ((lng - NL_BOUNDS.minLng) / (NL_BOUNDS.maxLng - NL_BOUNDS.minLng)) * MAP_ART_WIDTH,
        y: ((NL_BOUNDS.maxLat - lat) / (NL_BOUNDS.maxLat - NL_BOUNDS.minLat)) * MAP_ART_HEIGHT,
    };
}

// A rect whose bottom corners are rounded to the card's inner curve.
function panelPath(x: number, y: number, width: number, height: number, radius: number): string {
    return (
        `M${x} ${y} H${x + width} V${y + height - radius}` +
        ` A${radius} ${radius} 0 0 1 ${x + width - radius} ${y + height}` +
        ` H${x + radius} A${radius} ${radius} 0 0 1 ${x} ${y + height - radius} Z`
    );
}

// The personal card as one inline SVG.
export function buildMapCardSvg(context: MapCardContext): string {
    const { border, content, titleY, subtitleY, ruleY } = cardLayout(A7_WIDTH, A7_HEIGHT);

    // The personalised copy: title and the visitor's city.
    const title = translate(context.language, 'card.visitorTitle');
    const place = context.place ?? translate(context.language, 'card.yourNeighbourhood');
    const subtitle = translate(context.language, 'card.livesIn', { place });

    // The light panel fills everything below the header rule, edge to edge.
    const panel = { x: border.x, y: ruleY, width: border.width, height: border.y + border.height - ruleY };

    // The artwork is centred in the panel, keeping its aspect.
    const scale = Math.min(
        (panel.width - PANEL_INSET * 2) / MAP_ART_WIDTH,
        (panel.height - PANEL_INSET * 2) / MAP_ART_HEIGHT,
    );
    const artWidth = MAP_ART_WIDTH * scale;
    const artHeight = MAP_ART_HEIGHT * scale;
    const artX = panel.x + (panel.width - artWidth) / 2;
    const artY = panel.y + (panel.height - artHeight) / 2;

    // The figure sits in the panel's lower-right corner.
    const personWidth = PERSON_HEIGHT * (PERSON_VIEWBOX.width / PERSON_VIEWBOX.height);
    const personX = panel.x + panel.width - PANEL_INSET - personWidth;
    const personY = panel.y + panel.height - PANEL_INSET - PERSON_HEIGHT;

    // The marker: the visitor's point projected onto the artwork, and the line
    // from it to the figure's shoulder.
    const marker = context.center ? project(context.center) : null;
    const dotX = marker ? artX + marker.x * scale : 0;
    const dotY = marker ? artY + marker.y * scale : 0;
    const markerSvg =
        marker === null
            ? ''
            : `<line x1="${dotX}" y1="${dotY}" x2="${personX + personWidth / 2}" y2="${personY + PERSON_HEIGHT * 0.12}" stroke="${MARKER}" stroke-width="0.75"/>` +
              `<circle cx="${dotX}" cy="${dotY}" r="3.2" fill="${MARKER}"/>`;

    return (
        `<svg ${SVG_NS} width="${A7_WIDTH_MM}mm" height="${A7_HEIGHT_MM}mm" viewBox="0 0 ${A7_WIDTH} ${A7_HEIGHT}">` +
        `<defs>${MAP_SHADOW_DEFS}</defs>` +
        cardFrameSvg(A7_WIDTH, A7_HEIGHT) +
        // Header: title and the visitor's city, then the navy rule.
        `<text x="${content.x}" y="${titleY}" font-family="Familjen Grotesk" font-size="${TITLE_FONT_SIZE}" font-weight="700" fill="${INK}">${escapeXml(title)}</text>` +
        `<text x="${content.x}" y="${subtitleY}" font-family="Familjen Grotesk" font-size="${SUBTITLE_FONT_SIZE}" font-weight="400" fill="${INK}">${escapeXml(subtitle)}</text>` +
        // The light panel, then the navy rule over its top edge.
        `<path d="${panelPath(panel.x, panel.y, panel.width, panel.height, CARD_RADIUS - 1)}" fill="${PANEL}"/>` +
        `<line x1="${border.x}" y1="${ruleY}" x2="${border.x + border.width}" y2="${ruleY}" stroke="${INK}"/>` +
        `<g transform="translate(${artX} ${artY}) scale(${scale})">` +
        `<g filter="url(#map-art-shadow)" fill="#FFFFFF" stroke="${CARD_BORDER}" stroke-width="${1.2 / scale}" stroke-miterlimit="10">` +
        MAP_PATHS.map((d) => `<path d="${d}"/>`).join('') +
        `</g></g>` +
        markerSvg +
        // The visitor figure, drawn solid in the marker colour.
        `<svg x="${personX}" y="${personY}" width="${personWidth}" height="${PERSON_HEIGHT}" viewBox="${PERSON_VIEWBOX.x} ${PERSON_VIEWBOX.y} ${PERSON_VIEWBOX.width} ${PERSON_VIEWBOX.height}" fill="${MARKER}">` +
        PERSON_PATHS.map((d) => `<path d="${d}"/>`).join('') +
        `</svg>` +
        // The navy stroke last, so the panel and art never erode it.
        cardBorderSvg(A7_WIDTH, A7_HEIGHT) +
        `</svg>`
    );
}
