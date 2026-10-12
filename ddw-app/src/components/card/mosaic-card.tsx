// A card whose face is the provider mosaic: the same tiles, patterns and label
// rules as the A7 personal card, without its header. Used for the reveal card's
// reverse, the fuse screen's incoming cards and the outro's pinned card.

import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Svg } from 'react-native-svg';

import { CardContainer, CARD_BORDER_WIDTH } from '@/components/card/card-container';
import { MosaicTile } from '@/components/treemap/mosaic';
import { isUSFrequency } from '@/components/treemap/patternDefs';
import TreemapPatterns from '@/components/treemap/patterns';
import type { MeasurementFrequency } from '@/data/dependencies';
import { useTranslation } from '@/i18n/use-translation';
import { buildTreemapLayout } from '@/treemap/layout';
import { Spacing } from '@/theme/tokens';

// The border and padding the mosaic sits inside. Exported so a caller that lays
// out tiles itself (the reveal, to sequence the reds) uses the same box.
export const MOSAIC_INSET = CARD_BORDER_WIDTH * 2 + Spacing.sm * 2;

export function MosaicCard({
    frequencies,
    width,
    height,
    tileOrder,
    revealedUS = Number.MAX_SAFE_INTEGER,
}: {
    frequencies: MeasurementFrequency[];
    width: number;
    height: number;
    /** Each tile's slot in the global red sequence, when a caller sequences it. */
    tileOrder?: (number | null)[];
    /** How many red slots have been revealed so far. */
    revealedUS?: number;
}) {
    const { t } = useTranslation();
    const innerWidth = width - MOSAIC_INSET;
    const innerHeight = height - MOSAIC_INSET;
    const othersLabel = t('card.others');
    const rects = useMemo(
        () => buildTreemapLayout(frequencies, innerWidth, innerHeight, othersLabel),
        [frequencies, innerWidth, innerHeight, othersLabel],
    );

    // Without a caller-provided order, every US tile is red from the start.
    const order = useMemo(() => tileOrder ?? rects.map((rect) => (isUSFrequency(rect.frequency) ? 0 : null)), [tileOrder, rects]);

    // A service we measure nothing for is a blank card.
    if (rects.length === 0) return <CardContainer style={{ height, width }} />;

    return (
        <CardContainer style={[styles.card, { height, width }]}>
            <Svg width={innerWidth} height={innerHeight} viewBox={`0 0 ${innerWidth} ${innerHeight}`}>
                <TreemapPatterns />
                {/* A tile turns red once its slot in the sequence is reached. */}
                {rects.map((rect, index) => (
                    <MosaicTile
                        key={index}
                        rect={rect}
                        revealed={order[index] !== null && (order[index] as number) < revealedUS}
                    />
                ))}
            </Svg>
        </CardContainer>
    );
}

const styles = StyleSheet.create({
    card: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.sm,
    },
});
