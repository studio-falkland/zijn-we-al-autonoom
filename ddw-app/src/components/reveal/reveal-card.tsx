// One card in the reveal: the service's front, turning over onto its own provider
// mosaic. It eases from the opening fan (bottom-centre anchors, like the services
// hand) into its scaled grid slot, and flips when the stage cues it.

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

// A slot in the shared fan/grid space: the card's bottom-centre anchor, its tilt,
// and its scale. Anchoring the bottom centre keeps the fan's arc stable.
export type RevealPosition = { x: number; y: number; angle: number; scale: number };

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
    // Placement is by the card's bottom centre, so rotate and scale pivot there.
    const pivot = CARD.height / 2;
    const left = useSharedValue(position.fan.x - CARD.width / 2);
    const top = useSharedValue(position.fan.y - CARD.height);
    const angle = useSharedValue(position.fan.angle);
    const scale = useSharedValue(position.fan.scale);

    // On the fan-to-grid switch, ease every card to its grid slot and size.
    useEffect(() => {
        const target = grid ? position.grid : position.fan;
        left.value = withTiming(target.x - CARD.width / 2, { duration: MOVE_DURATION });
        top.value = withTiming(target.y - CARD.height, { duration: MOVE_DURATION });
        angle.value = withTiming(target.angle, { duration: MOVE_DURATION });
        scale.value = withTiming(target.scale, { duration: MOVE_DURATION });
    }, [grid, position, left, top, angle, scale]);

    // The pivot shift turns and scales about the bottom centre, not the middle.
    const motion = useAnimatedStyle(() => ({
        transform: [
            { translateX: left.value },
            { translateY: top.value },
            { translateY: pivot },
            { rotate: `${angle.value}deg` },
            { scale: scale.value },
            { translateY: -pivot },
        ],
    }));

    return (
        <Animated.View style={[styles.card, styles.slot, motion]}>
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
