// One card in the reveal: the service's front, turning over onto its own provider
// mosaic. It eases from the opening fan (bottom-centre anchors, like the services
// hand) into its scaled grid slot, and flips when the stage cues it.

import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { FlipCard } from '@/components/card/flip-card';
import { MosaicCard } from '@/components/card/mosaic-card';
import { CARD_DIMENSIONS, OrganisationCard } from '@/components/organisation-card';
import type { ServiceProviders } from '@/data/dependencies';

// The card box. The mosaic inside its border is sized by MosaicCard.
const CARD = CARD_DIMENSIONS.medium;

// The fan-to-grid move and the turn itself.
const MOVE_DURATION = 600;
const FLIP_DURATION = 320;

// A slot in the shared fan/grid space: the card's bottom-centre anchor, its tilt,
// and its scale. Anchoring the bottom centre keeps the fan's arc stable.
export type RevealPosition = { x: number; y: number; angle: number; scale: number };

export function RevealCard({
    card,
    tileOrder,
    flipped,
    revealedUS,
    position,
    grid,
}: {
    card: ServiceProviders;
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
                back={
                    <MosaicCard
                        frequencies={card.frequencies}
                        width={CARD.width}
                        height={CARD.height}
                        tileOrder={tileOrder}
                        revealedUS={revealedUS}
                    />
                }
            />
        </Animated.View>
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
});
