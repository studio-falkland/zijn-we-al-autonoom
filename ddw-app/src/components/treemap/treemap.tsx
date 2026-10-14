// The A7 dependency sheet preview: the header (title, the visitor's city and the
// legend) and the dependency mosaic, rendered with the shared vector patterns.
// The layout comes from geometry.ts, so the preview matches the printed sheet.

import { useMemo, type ReactNode } from 'react';
import { ClipPath, G, Line, Path, Rect, Svg, Text } from 'react-native-svg';

import type { CardContext } from '@/card/cardHtml';
import {
    LABEL_FONT_SIZE,
    LEGEND_FIRST_BASELINE,
    LEGEND_FONT_SIZE,
    LEGEND_PERCENT_WIDTH,
    LEGEND_ROW_HEIGHT,
    LEGEND_SWATCH,
    LEGEND_WIDTH,
    PLATE_HEIGHT,
    PLATE_PADDING,
    PLATE_WIDTH_RATIO,
    SUBTITLE_FONT_SIZE,
    TITLE_FONT_SIZE,
    sheetLayout,
} from '@/card/geometry';
import type { MeasurementFrequency } from '@/data/dependencies';
import { translate } from '@/i18n';
import { buildTreemapLayout, type TreemapRect } from '@/treemap/layout';
import { frequencyLabelName, truncateLabel } from '@/treemap/label';
import { buildLegend, type LegendEntry } from '@/treemap/legend';
import { Colors, Fonts } from '@/theme/tokens';
import { isUSFrequency, PatternMatcher, patternDefs, scaledPatternDef, type PatternDef } from './patternDefs';
import TreemapPatterns from './patterns';

// The leaf fills: red for US-hosted dependencies, blue for everything else.
const LEAF_BLUE = '#0000FF';
const LEAF_RED = '#FF0000';
const LEAF_BASE = '#FFFFFF';

// One mosaic tile: light base, patterned fill, and the clipped label.
// Only the largest provider gets a label, and it is the name only.
function Tile({ rect, index, label }: { rect: TreemapRect; index: number; label: string | null }) {
    const { frequency } = rect;
    const us = isUSFrequency(frequency);
    const mask = PatternMatcher(frequency);

    // The label plate spans the tile; the text is truncated to fit it.
    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;
    // The label plate is capped at a fraction of the tile width, centred; the
    // text is truncated to fit inside it.
    const plateWidth = rect.width * PLATE_WIDTH_RATIO;
    const plateX = rect.x + (rect.width - plateWidth) / 2;
    const plateY = centerY - PLATE_HEIGHT / 2;
    const textWidth = plateWidth - PLATE_PADDING * 2;
    const fittedLabel = label ? truncateLabel(label, textWidth - 8, LABEL_FONT_SIZE) : null;

    return (
        <G>
            <ClipPath id={`clip-${index}`}>
                <Rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} />
            </ClipPath>
            <Rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx={4} fill={LEAF_BASE} />
            <Rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx={4} fill={us ? LEAF_RED : LEAF_BLUE} mask={mask} />
            {fittedLabel && (
                <>
                    {/* The plate clips the name to itself, so the text can never exceed it. */}
                    <ClipPath id={`plate-${index}`}>
                        <Rect x={plateX} y={plateY} width={plateWidth} height={PLATE_HEIGHT} rx={4} />
                    </ClipPath>
                    {/* The name is inset inside the plate, so the plate reads as padding. */}
                    <ClipPath id={`plate-text-${index}`}>
                        <Rect x={plateX + PLATE_PADDING} y={plateY} width={textWidth} height={PLATE_HEIGHT} rx={4} />
                    </ClipPath>
                    <Rect
                        x={plateX}
                        y={plateY}
                        width={plateWidth}
                        height={PLATE_HEIGHT}
                        fill={Colors.white}
                        clipPath={`url(#clip-${index})`}
                        rx={4}
                    />
                    <Text
                        x={centerX}
                        y={centerY + 4}
                        fontSize={LABEL_FONT_SIZE}
                        fontWeight="400"
                        fill={Colors.blue[900]}
                        textAnchor="middle"
                        clipPath={`url(#plate-text-${index})`}
                        fontFamily={Fonts.family}
                    >
                        {fittedLabel}
                    </Text>
                </>
            )}
        </G>
    );
}

// One legend swatch: the pattern drawn directly, as a small tiling of its tile.
// The mask+pattern route reads as a solid block at this size in the print
// pipeline, so the motif's own paths are emitted instead, clipped to the swatch.
function LegendSwatch({ tile, tint, x, y, index }: { tile: PatternDef; tint: string; x: number; y: number; index: number }) {
    const hatched = tile.paths.every((path) => path.stroke !== undefined);
    const scale = LEGEND_SWATCH / ((hatched ? 3 : 1) * Math.max(tile.width, tile.height));
    const cols = Math.ceil(LEGEND_SWATCH / (tile.width * scale));
    const rows = Math.ceil(LEGEND_SWATCH / (tile.height * scale));

    const tiles: ReactNode[] = [];
    for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
            tiles.push(
                <G key={`${row}-${col}`} transform={`translate(${col * tile.width} ${row * tile.height})`}>
                    {tile.paths.map((path, i) =>
                        path.stroke !== undefined ? (
                            <Path key={i} d={path.d} fill="none" stroke={tint} strokeWidth={1 / scale} />
                        ) : (
                            <Path key={i} d={path.d} fill={tint} fillRule={path.fillRule ? 'evenodd' : 'nonzero'} />
                        ),
                    )}
                </G>,
            );
        }
    }

    return (
        <G clipPath={`url(#legend-swatch-${index})`}>
            <ClipPath id={`legend-swatch-${index}`}>
                <Rect x={x} y={y} width={LEGEND_SWATCH} height={LEGEND_SWATCH} rx={2} />
            </ClipPath>
            <G transform={`translate(${x} ${y}) scale(${scale})`}>{tiles}</G>
        </G>
    );
}

// One legend row: the patterned swatch, the provider name, and its share.
function LegendRow({ entry, index, content }: { entry: LegendEntry; index: number; content: { x: number; width: number; y: number } }) {
    const right = content.x + content.width;
    const left = right - LEGEND_WIDTH;
    const baseline = content.y + LEGEND_FIRST_BASELINE + index * LEGEND_ROW_HEIGHT;
    const nameWidth = LEGEND_WIDTH - LEGEND_SWATCH - 5 - LEGEND_PERCENT_WIDTH;
    const name = truncateLabel(entry.category, nameWidth, LEGEND_FONT_SIZE);
    const tint = entry.us ? LEAF_RED : LEAF_BLUE;
    const def = patternDefs.find((pattern) => pattern.id === entry.patternId);
    const swatchY = baseline - LEGEND_SWATCH + 1;

    return (
        <G>
            <Rect x={left} y={swatchY} width={LEGEND_SWATCH} height={LEGEND_SWATCH} rx={2} fill={LEAF_BASE} />
            {def && <LegendSwatch tile={scaledPatternDef(def)} tint={tint} x={left} y={swatchY} index={index} />}
            <Text x={left + LEGEND_SWATCH + 5} y={baseline} fontSize={LEGEND_FONT_SIZE} fill={Colors.blue[900]} fontFamily={Fonts.family}>
                {name}
            </Text>
            <Text x={right} y={baseline} fontSize={LEGEND_FONT_SIZE} fill={Colors.blue[900]} textAnchor="end" fontFamily={Fonts.family}>
                {`${entry.percent}%`}
            </Text>
        </G>
    );
}

// The full A7 sheet at a fixed size; frequencies come from the selection.
export function Treemap({
    frequencies,
    width,
    height,
    context,
}: {
    frequencies: MeasurementFrequency[];
    width: number;
    height: number;
    context: CardContext;
}) {
    const { content, body, titleY, subtitleY, ruleY } = sheetLayout(width, height);

    // The mosaic is laid out in its own region, then shifted into the sheet.
    const tiles = useMemo(
        () => buildTreemapLayout(frequencies, body.width, body.height, translate(context.language, 'card.others')),
        [frequencies, body.width, body.height, context.language],
    );
    const legend = useMemo(() => buildLegend(frequencies), [frequencies]);
    const place = context.place ?? translate(context.language, 'card.yourNeighbourhood');

    return (
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <TreemapPatterns />
            {/* A white background, no stroke or shadow (the printed sheet is
                borderless too, see cardHtml.ts). */}
            <Rect width={width} height={height} rx={16} fill={Colors.white} />
            {/* Header: title and the visitor's place on the left, the legend on the right. */}
            <Text x={content.x} y={titleY} fontSize={TITLE_FONT_SIZE} fontWeight="700" fill={Colors.blue[900]} fontFamily={Fonts.family}>
                {translate(context.language, 'card.visitorTitle')}
            </Text>
            <Text x={content.x} y={subtitleY} fontSize={SUBTITLE_FONT_SIZE} fontWeight="400" fill={Colors.blue[900]} fontFamily={Fonts.family}>
                {translate(context.language, 'card.livesIn', { place })}
            </Text>
            {legend.map((entry, index) => (
                <LegendRow key={index} entry={entry} index={index} content={content} />
            ))}
            <Line x1={content.x} y1={ruleY} x2={content.x + content.width} y2={ruleY} stroke={Colors.blue[900]} />
            {/* The treemap mosaic, filling the space the header leaves over. */}
            {tiles.map((rect, index) => (
                <Tile
                    key={index}
                    rect={{ ...rect, x: rect.x + body.x, y: rect.y + body.y }}
                    index={index}
                    label={index === 0 ? frequencyLabelName(rect.frequency) : null}
                />
            ))}
        </Svg>
    );
}
