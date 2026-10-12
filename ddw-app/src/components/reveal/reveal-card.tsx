// One card in the reveal: the service's front, turning over onto its own provider
// mosaic. It eases between the fan and grid slots and flips when the stage cues it.

import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Svg } from 'react-native-svg';

import { CardContainer, CARD_BORDER_WIDTH } from '@/components/card/card-container';
import { FlipCard } from '@/components/card/flip-card';
import { CARD_DIMENSIONS, OrganisationCard } from '@/components/organisation-card';
import { MosaicTile } from '@/components/treemap/mosaic';
import TreemapPatterns from '@/components/treemap/patterns';
import type { ServiceProviders } from '@/data/dependencies';
import type { TreemapRect } from '@/treemap/layout';
import { Spacing } from '@/theme/tokens';

// The card box, and the mosaic inset inside its border. Exported so the stage
// lays out each card's tiles at exactly the size this card renders them.
const CARD = CARD_DIMENSIONS.medium;
export const MOSAIC_SIZE = {
    width: CARD.width - CARD_BORDER_WIDTH * 2 - Spacing.sm * 2,
    height: CARD.height - CARD_BORDER_WIDTH * 2 - Spacing.sm * 2,
};

// The fan-to-grid move and the turn itself.
const MOVE_DURATION = 600;
const FLIP_DURATION = 320;

// A slot in the shared fan/grid box: where the card sits and how far it tilts.
export type RevealPosition = { x: number; y: number; angle: number };

export function RevealCard({
    card,
    rects,
    tileOrder,
    flipped,
    revealedUS,
    position,
    grid,
}: {
    card: ServiceProviders;
    rects: TreemapRect[];
    tileOrder: (number | null)[];
    flipped: boolean;
    revealedUS: number;
    position: { fan: RevealPosition; grid: RevealPosition };
    grid: boolean;
}) {
    // The bottom-centre pivot keeps the fan grounded while the tops swing out.
    const pivot = CARD.height / 2;
    const x = useSharedValue(position.fan.x);
    const y = useSharedValue(position.fan.y);
    const angle = useSharedValue(position.fan.angle);

    // On the fan-to-grid switch, ease every card to its grid slot and upright.
    useEffect(() => {
        const target = grid ? position.grid : position.fan;
        x.value = withTiming(target.x, { duration: MOVE_DURATION });
        y.value = withTiming(target.y, { duration: MOVE_DURATION });
        angle.value = withTiming(target.angle, { duration: MOVE_DURATION });
    }, [grid, position, x, y, angle]);

    const tilt = useAnimatedStyle(() => ({
        transform: [
            { translateX: x.value },
            { translateY: y.value },
            { translateY: pivot },
            { rotate: `${angle.value}deg` },
            { translateY: -pivot },
        ],
    }));

    return (
        <Animated.View style={[styles.card, styles.slot, tilt]}>
            <FlipCard
                flipped={flipped}
                duration={FLIP_DURATION}
                style={styles.card}
                front={<OrganisationCard organisation={card.service} size="medium" />}
                back={<CardBack rects={rects} tileOrder={tileOrder} revealedUS={revealedUS} />}
            />
        </Animated.View>
    );
}

// The card's reverse: the service's provider mosaic, or a blank card when we
// measure no providers for it (the synthesised grid operators, say).
function CardBack({
    rects,
    tileOrder,
    revealedUS,
}: {
    rects: TreemapRect[];
    tileOrder: (number | null)[];
    revealedUS: number;
}) {
    if (rects.length === 0) return <CardContainer style={styles.back} />;

    return (
        <CardContainer style={styles.back}>
            <Svg width={MOSAIC_SIZE.width} height={MOSAIC_SIZE.height} viewBox={`0 0 ${MOSAIC_SIZE.width} ${MOSAIC_SIZE.height}`}>
                <TreemapPatterns />
                {/* A tile turns red once its slot in the global US sequence is reached. */}
                {rects.map((rect, index) => (
                    <MosaicTile
                        key={index}
                        rect={rect}
                        revealed={tileOrder[index] !== null && (tileOrder[index] as number) < revealedUS}
                    />
                ))}
            </Svg>
        </CardContainer>
    );
}

const styles = StyleSheet.create({
    slot: {
        left: 0,
        position: 'absolute',
        top: 0,
    },
    card: {
        height: CARD.height,
        width: CARD.width,
    },
    back: {
        alignItems: 'center',
        height: CARD.height,
        justifyContent: 'center',
        padding: Spacing.sm,
        width: CARD.width,
    },
});
