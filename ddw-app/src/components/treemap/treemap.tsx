// The treemap renderer: lays out the dependency frequencies and draws the
// leaves with the shared vector patterns (screen version of the A7 artwork).

import { useMemo } from 'react';
import { G, Rect, Svg, Text } from 'react-native-svg';

import type { MeasurementFrequency } from '@/data/dependencies';
import { buildTreemapLayout, type TreemapRect } from '@/treemap/layout';
import { Colors } from '@/theme/tokens';
import TreemapPatterns, { PatternMatcher } from './patterns';

// The leaf fills: blue for everything, matching the web app's default state.
const LEAF_FILL = '#0000FF';
const LEAF_BASE = '#F6F6FF';

// Only label a tile when it is large enough to hold a line of text.
function showsLabel(rect: TreemapRect): boolean {
    return rect.width >= 64 && rect.height >= 32;
}

// One treemap tile: light base, patterned blue hatch, optional label.
function TreemapTile({ rect }: { rect: TreemapRect }) {
    const { frequency } = rect;
    const mask = PatternMatcher(frequency);
    const label = `${frequency.category} (${(frequency.ratio * 100).toFixed(1)}%)`;

    return (
        <G>
            <Rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx={4} fill={LEAF_BASE} />
            <Rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx={4} fill={LEAF_FILL} mask={mask} />
            {showsLabel(rect) && (
                <Text x={rect.x + 8} y={rect.y + 20} fontSize={11} fill={Colors.blue[900]} fontWeight="bold">
                    {label}
                </Text>
            )}
        </G>
    );
}

// The full treemap at a fixed size; frequencies come from the selection.
export function Treemap({ frequencies, width, height }: { frequencies: MeasurementFrequency[]; width: number; height: number }) {
    const tiles = useMemo(() => buildTreemapLayout(frequencies, width, height), [frequencies, width, height]);

    return (
        <Svg width={width} height={height}>
            <TreemapPatterns />
            {tiles.map((rect, index) => (
                <TreemapTile key={index} rect={rect} />
            ))}
        </Svg>
    );
}
