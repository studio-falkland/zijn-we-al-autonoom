// A card whose face is the provider mosaic: the same tiles, patterns and label
// rules as the A7 personal card. An optional header sits above the mosaic, so a
// flipped card keeps its organisation name on the back. Also used for the fuse
// screen's incoming cards and the outro's pinned card.

import { useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
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
    header,
}: {
    frequencies: MeasurementFrequency[];
    width: number;
    height: number;
    /** Each tile's slot in the global red sequence, when a caller sequences it. */
    tileOrder?: (number | null)[];
    /** How many red slots have been revealed so far. */
    revealedUS?: number;
    /** A face above the mosaic, e.g. an organisation header on a card's back. */
    header?: ReactNode;
}) {
    const { t } = useTranslation();
    const othersLabel = t('card.others');
    const innerWidth = width - MOSAIC_INSET;

    // With a header the mosaic fills what the header leaves over, so its height is
    // only known once the body below the header has been laid out.
    const [bodyHeight, setBodyHeight] = useState(0);
    const innerHeight = header ? bodyHeight - Spacing.sm * 2 : height - MOSAIC_INSET;

    const rects = useMemo(
        () => (innerHeight > 0 ? buildTreemapLayout(frequencies, innerWidth, innerHeight, othersLabel) : []),
        [frequencies, innerWidth, innerHeight, othersLabel],
    );

    // Without a caller-provided order, every US tile is red from the start.
    const order = useMemo(() => tileOrder ?? rects.map((rect) => (isUSFrequency(rect.frequency) ? 0 : null)), [tileOrder, rects]);

    const mosaic =
        rects.length > 0 ? (
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
        ) : null;

    // A service we measure nothing for is a blank card (its header, if any, still shows).
    if (!header) {
        return <CardContainer style={[styles.card, { height, width }]}>{mosaic}</CardContainer>;
    }

    const handleBodyLayout = (event: LayoutChangeEvent) => setBodyHeight(event.nativeEvent.layout.height);

    return (
        <CardContainer style={{ height, width }}>
            {header}
            <View style={styles.body} onLayout={handleBodyLayout}>
                {mosaic}
            </View>
        </CardContainer>
    );
}

const styles = StyleSheet.create({
    card: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.sm,
    },
    body: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        padding: Spacing.sm,
    },
});
