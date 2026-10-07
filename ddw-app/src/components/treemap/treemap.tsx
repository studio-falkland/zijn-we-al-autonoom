// The A7 card preview: header and the dependency mosaic, rendered with the
// shared vector patterns (screen version of the print art).

import { useMemo } from 'react';
import { ClipPath, G, Line, Rect, Svg, Text } from 'react-native-svg';

import type { CardContext } from '@/card/cardHtml';
import type { MeasurementFrequency } from '@/data/dependencies';
import { buildTreemapLayout, type TreemapRect } from '@/treemap/layout';
import { frequencyLabelName, truncateLabel } from '@/treemap/label';
import { Colors, Fonts } from '@/theme/tokens';
import { isUSFrequency, PatternMatcher } from './patternDefs';
import TreemapPatterns from './patterns';

// The leaf fills: red for US-hosted dependencies, blue for everything else.
const LEAF_BLUE = '#0000FF';
const LEAF_RED = '#FF0000';
const LEAF_BASE = '#F6F6FF';

// Card layout: two constants, everything else is derived from them and the
// page size, so the mosaic always fills the space the header leaves over.
const MARGIN = 10; // space between the page edge and the navy border
const PADDING = 12; // space between the navy border and the card content

// The header type rhythm, measured from the content box top.
const TITLE_TOP = 12; // title baseline
const SUBTITLE_TOP = 28; // subtitle baseline

// The mosaic follows the text with the same padding.
const MOSAIC_TOP = SUBTITLE_TOP + PADDING + 8;

// One mosaic tile: light base, patterned fill, and a clipped label.
// Only the largest provider gets a label, and it is the name only.
function Tile({ rect, index, label }: { rect: TreemapRect; index: number; label: string | null }) {
    const { frequency } = rect;
    const us = isUSFrequency(frequency);
    const mask = PatternMatcher(frequency);

    // The label plate: spans the tile, pale blue, with the name centred and
    // truncated to fit so it never exceeds the background.
    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;
    const plateX = rect.x + 16;
    const plateY = centerY - 12;
    const plateWidth = rect.width - 32;
    const fittedLabel = label ? truncateLabel(label, plateWidth - 8) : null;

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
                        <Rect x={plateX} y={plateY} width={plateWidth} height={24} rx={4} />
                    </ClipPath>
                    <Rect
                        x={plateX}
                        y={plateY}
                        width={plateWidth}
                        height={24}
                        fill={Colors.blue[50]}
                        clipPath={`url(#clip-${index})`}
                        rx={4}
                    />
                    <Text
                        x={centerX}
                        y={centerY + 4}
                        fontSize={12}
                        fontWeight="400"
                        fill={Colors.blue[900]}
                        textAnchor="middle"
                        clipPath={`url(#plate-${index})`}
                        fontFamily={Fonts.family}
                    >
                        {fittedLabel}
                    </Text>
                </>
            )}
        </G>
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

// The full A7 card at a fixed size; frequencies come from the selection.
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
    const { border, content, titleY, subtitleY, mosaic } = cardLayout(width, height);

    // The mosaic is laid out in its own region, then shifted into the card.
    const tiles = useMemo(
        () => buildTreemapLayout(frequencies, mosaic.width, mosaic.height),
        [frequencies, mosaic.width, mosaic.height],
    );
    const place = context.place ?? 'jouw buurt';

    return (
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <TreemapPatterns />
            {/* Card body and navy border. */}
            <Rect width={width} height={height} rx={16} fill={Colors.white} />
            <Rect x={border.x} y={border.y} width={border.width} height={border.height} rx={15} fill="none" stroke={Colors.blue[800]} strokeWidth={2} />
            {/* Header: title and the visitor's place, then the navy rule. */}
            <Text x={content.x} y={titleY} fontSize={18} fontWeight="700" fill={Colors.blue[900]} fontFamily={Fonts.family}>
                Jij
            </Text>
            <Text x={content.x} y={subtitleY} fontSize={12} fontWeight="400" fill={Colors.blue[900]} fontFamily={Fonts.family}>
                Woont in {place}
            </Text>
            <Line x1={border.x} y1={subtitleY + 11} x2={border.x + border.width} y2={subtitleY + 11} stroke={Colors.blue[900]} />
            {/* The treemap mosaic, filling the space the header leaves over. */}
            {tiles.map((rect, index) => (
                <Tile
                    key={index}
                    rect={{ ...rect, x: rect.x + mosaic.x, y: rect.y + mosaic.y }}
                    index={index}
                    label={index === 0 ? frequencyLabelName(rect.frequency) : null}
                />
            ))}
        </Svg>
    );
}
