// On-screen version of the personal map card: header, the three-row legend-free
// layout, the light panel, the pixelated Netherlands artwork, the visitor's dot
// and the figure it points to. Mirrors the printed card (src/card/mapCardHtml.ts).

import { Circle, G, Line, Path, Rect, Svg, Text } from 'react-native-svg';

import type { Language } from '@/i18n';
import { translate } from '@/i18n';
import { MAP_ART_HEIGHT, MAP_ART_WIDTH, MAP_PATHS, PERSON_PATHS, PERSON_VIEWBOX } from '@/card/mapArt';
import { SHADOW_OFFSET, SUBTITLE_FONT_SIZE, TITLE_FONT_SIZE, cardLayout } from '@/card/geometry';
import { Colors, Fonts } from '@/theme/tokens';

// The Netherlands' WGS84 bounding box, mapped linearly onto the artwork's box.
const NL_BOUNDS = { minLng: 3.36, maxLng: 7.23, minLat: 50.75, maxLat: 53.55 };

// The space kept around the artwork and the figure inside the panel.
const PANEL_INSET = 16;

// The visitor figure's height in px; its width follows the icon's aspect.
const PERSON_HEIGHT = 66;

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

export function MapCard({
    width,
    height,
    place,
    center,
    language,
}: {
    width: number;
    height: number;
    place: string | null;
    center: [number, number] | null;
    language: Language;
}) {
    const { border, content, titleY, subtitleY, ruleY } = cardLayout(width, height);

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

    // The visitor's point, projected onto the artwork.
    const marker = center ? project(center) : null;
    const dotX = marker ? artX + marker.x * scale : 0;
    const dotY = marker ? artY + marker.y * scale : 0;
    const markColor = Colors.blue[800];
    const placeLabel = place ?? translate(language, 'card.yourNeighbourhood');

    return (
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* Card body, the hard offset shadow, and the navy border. */}
            <Rect width={width} height={height} rx={16} fill={Colors.white} />
            <Rect x={border.x + SHADOW_OFFSET} y={border.y + SHADOW_OFFSET} width={border.width} height={border.height} rx={15} fill={Colors.shadow} />
            <Rect x={border.x} y={border.y} width={border.width} height={border.height} rx={15} fill={Colors.white} />
            {/* Header: title and the visitor's city, then the navy rule. */}
            <Text x={content.x} y={titleY} fontSize={TITLE_FONT_SIZE} fontWeight="700" fill={Colors.blue[900]} fontFamily={Fonts.family}>
                {translate(language, 'card.visitorTitle')}
            </Text>
            <Text x={content.x} y={subtitleY} fontSize={SUBTITLE_FONT_SIZE} fontWeight="400" fill={Colors.blue[900]} fontFamily={Fonts.family}>
                {translate(language, 'card.livesIn', { place: placeLabel })}
            </Text>
            {/* The light panel, then the navy rule over its top edge. */}
            <Path d={panelPath(panel.x, panel.y, panel.width, panel.height, 14)} fill={Colors.blue[50]} />
            <Line x1={border.x} y1={ruleY} x2={border.x + border.width} y2={ruleY} stroke={Colors.blue[900]} />
            <G transform={`translate(${artX}, ${artY}) scale(${scale})`}>
                {MAP_PATHS.map((d, index) => (
                    <Path key={index} d={d} fill={Colors.white} stroke={Colors.blue[800]} strokeWidth={1.2 / scale} strokeMiterlimit={10} />
                ))}
            </G>
            {marker && <Line x1={dotX} y1={dotY} x2={personX + personWidth / 2} y2={personY + PERSON_HEIGHT * 0.12} stroke={markColor} strokeWidth={0.75} />}
            {marker && <Circle cx={dotX} cy={dotY} r={3.2} fill={markColor} />}
            {/* The visitor figure, drawn solid in the marker colour. */}
            <G transform={`translate(${personX}, ${personY}) scale(${personWidth / PERSON_VIEWBOX.width}, ${PERSON_HEIGHT / PERSON_VIEWBOX.height}) translate(${-PERSON_VIEWBOX.x}, 0)`}>
                {PERSON_PATHS.map((d, index) => (
                    <Path key={index} d={d} fill={markColor} />
                ))}
            </G>
            {/* The navy stroke last, so the panel and art never erode it. */}
            <Rect x={border.x} y={border.y} width={border.width} height={border.height} rx={15} fill="none" stroke={Colors.blue[800]} strokeWidth={2} />
        </Svg>
    );
}
