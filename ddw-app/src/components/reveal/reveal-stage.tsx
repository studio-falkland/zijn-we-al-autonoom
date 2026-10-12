// The reveal stage. The gathered service cards open in the same bottom fan as the
// services screens, settle into a grid in the left two-thirds, and the visitor
// steps through three button-gated phases on the right third: turn the cards over
// onto their provider mosaics (Reveal), recolour the US providers red (Shut them
// down), then finish.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { Button } from '@/components/button';
import { MOSAIC_INSET } from '@/components/card/mosaic-card';
import { fanLayout } from '@/components/fan-layout';
import { CARD_DIMENSIONS } from '@/components/organisation-card';
import { RECOLOR_DURATION } from '@/components/treemap/mosaic';
import { isUSFrequency } from '@/components/treemap/patternDefs';
import type { ServiceProviders } from '@/data/dependencies';
import type { MessageKey } from '@/i18n';
import { useTranslation } from '@/i18n/use-translation';
import { buildTreemapLayout } from '@/treemap/layout';
import { Spacing, Theme, Type } from '@/theme/tokens';
import { RevealCard, type RevealPosition } from './reveal-card';

// Card metrics, kept in step with the reveal card's own box.
const CARD = CARD_DIMENSIONS.medium;

// Grid spacing, the fan's tilt, and how far the opening fan sinks off-screen —
// matching the services hand, which sits with its lower third cut off.
const GAP = 24;
const FAN_ANGLE = 10;
const FAN_SINK = CARD.height / 5;
const STAGE_PADDING = Spacing.lg;

// The timeline: long gaps between steps, short moves within them.
const FAN_HOLD = 900;
const MOVE_DURATION = 600;
const GRID_SETTLE = 350;
const FLIP_STAGGER = 450;
const FLIP_DURATION = 320;
const POST_FLIP_HOLD = 500;
const RECOLOR_STAGGER = 360;
const POST_RECOLOR_HOLD = 600;

// The copy per phase, as i18n keys. The visitor moves between phases with the
// panel's button.
const COPY: { preTurn: MessageKey[]; preColor: MessageKey[]; postColor: MessageKey[] } = {
    preTurn: ['reveal.preTurn1', 'reveal.preTurn2', 'reveal.preTurn3'],
    preColor: ['reveal.preColor'],
    postColor: ['reveal.postColor'],
};

// The phase the reveal is in: settling, waiting on Reveal, turning, waiting on
// Shut them down, recolouring, or finished.
type Stage = 'grid' | 'ready-reveal' | 'turning' | 'ready-shutdown' | 'shutting' | 'done';

export function RevealStage({ cards, onContinue }: { cards: ServiceProviders[]; onContinue: () => void }) {
    const { t } = useTranslation();
    const [screen, setScreen] = useState<{ width: number; height: number } | null>(null);
    const [stageArea, setStageArea] = useState<{ width: number; height: number } | null>(null);
    const [stage, setStage] = useState<Stage>('grid');
    const [grid, setGrid] = useState(false);
    const [flipped, setFlipped] = useState(0);
    const [revealedUS, setRevealedUS] = useState(0);

    // Each card's tiles, the US recolour order, and the fan/grid slots.
    const plan = useMemo(
        () => (screen && stageArea ? planReveal(cards, screen, stageArea, t('card.others')) : null),
        [cards, screen, stageArea, t],
    );
    const usCount = plan?.usCount ?? 0;

    // On entry: hold the fan briefly, then settle into the grid and offer Reveal.
    useEffect(() => {
        const move = setTimeout(() => setGrid(true), FAN_HOLD);
        const ready = setTimeout(() => setStage('ready-reveal'), FAN_HOLD + MOVE_DURATION + GRID_SETTLE);
        return () => {
            clearTimeout(move);
            clearTimeout(ready);
        };
    }, []);

    // Reveal: turn the cards over one by one, then offer the shutdown step.
    useEffect(() => {
        if (stage !== 'turning') return;
        const timers = cards.map((_, index) => setTimeout(() => setFlipped(index + 1), index * FLIP_STAGGER));
        const tail = Math.max(cards.length - 1, 0) * FLIP_STAGGER + FLIP_DURATION + POST_FLIP_HOLD;
        timers.push(setTimeout(() => setStage('ready-shutdown'), tail));
        return () => timers.forEach((timer) => clearTimeout(timer));
    }, [stage, cards]);

    // Shut down: recolour the US providers one by one, then finish.
    useEffect(() => {
        if (stage !== 'shutting') return;
        const timers = Array.from({ length: usCount }, (_, index) =>
            setTimeout(() => setRevealedUS(index + 1), index * RECOLOR_STAGGER),
        );
        const tail = Math.max(usCount - 1, 0) * RECOLOR_STAGGER + RECOLOR_DURATION + POST_RECOLOR_HOLD;
        timers.push(setTimeout(() => setStage('done'), tail));
        return () => timers.forEach((timer) => clearTimeout(timer));
    }, [stage, usCount]);

    const handleScreenLayout = useCallback((event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setScreen({ width, height });
    }, []);
    const handleStageLayout = useCallback((event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setStageArea({ width, height });
    }, []);

    const panel = panelFor(stage, { reveal: () => setStage('turning'), shutdown: () => setStage('shutting'), onContinue });

    return (
        <View style={styles.screen} onLayout={handleScreenLayout}>
            {/* The cards, in full-screen coordinates, behind the panel. */}
            <View style={styles.cardsLayer} pointerEvents="none">
                {plan &&
                    cards.map((card, index) => (
                        <RevealCard
                            key={card.service.slug}
                            card={card}
                            tileOrder={plan.cards[index].tileOrder}
                            flipped={index < flipped}
                            revealedUS={revealedUS}
                            position={plan.positions[index]}
                            grid={grid}
                        />
                    ))}
            </View>
            {/* Left two-thirds is the stage the cards gather into; right third is
                the panel, opaque so it masks the fan behind it. */}
            <View style={styles.row}>
                <View style={styles.stage} onLayout={handleStageLayout} />
                <View style={styles.panel}>
                    <View style={styles.copy}>
                        {panel.copy.map((key) => (
                            <Text key={key} style={styles.line}>
                                {t(key)}
                            </Text>
                        ))}
                    </View>
                    <Button label={t(panel.label)} onPress={panel.onPress} disabled={panel.disabled} />
                </View>
            </View>
        </View>
    );
}

// The copy, action label and callback for the current phase.
function panelFor(
    stage: Stage,
    actions: { reveal: () => void; shutdown: () => void; onContinue: () => void },
): { copy: MessageKey[]; label: MessageKey; onPress: () => void; disabled: boolean } {
    if (stage === 'done') {
        return { copy: COPY.postColor, label: 'common.continue', onPress: actions.onContinue, disabled: false };
    }
    if (stage === 'ready-shutdown' || stage === 'shutting') {
        return {
            copy: COPY.preColor,
            label: 'reveal.shutdown',
            onPress: actions.shutdown,
            disabled: stage !== 'ready-shutdown',
        };
    }
    return { copy: COPY.preTurn, label: 'reveal.reveal', onPress: actions.reveal, disabled: stage !== 'ready-reveal' };
}

// Each card's mosaic, the global US recolour order, and its fan/grid slots.
function planReveal(
    cards: ServiceProviders[],
    screen: { width: number; height: number },
    stageArea: { width: number; height: number },
    othersLabel: string,
) {
    // A running counter hands each US tile its slot in the blue-to-red sequence.
    let usCount = 0;
    const laid = cards.map((card) => {
        const rects = buildTreemapLayout(card.frequencies, CARD.width - MOSAIC_INSET, CARD.height - MOSAIC_INSET, othersLabel);
        const tileOrder = rects.map((rect) => (isUSFrequency(rect.frequency) ? usCount++ : null));
        return { tileOrder };
    });
    const positions = slotsFor(cards.length, screen, stageArea);
    return { cards: laid, usCount, positions };
}

// The fan slot (bottom-centre anchors off the screen's bottom edge, like the
// services hand) and the grid slot (scaled to fit the stage) for each card.
function slotsFor(n: number, screen: { width: number; height: number }, stageArea: { width: number; height: number }) {
    // The fan spans the whole screen, sunk so its lower third is cut off.
    const hand = fanLayout({ count: n, width: screen.width, cardWidth: CARD.width, cardHeight: CARD.height, maxAngle: FAN_ANGLE });
    const containerTop = screen.height + FAN_SINK - hand.height;

    // The grid aims to match the stage's shape so the cards stay large.
    const ratio = (stageArea.width / stageArea.height) * (CARD.height / CARD.width);
    const cols = Math.max(1, Math.min(Math.max(n, 1), Math.round(Math.sqrt(Math.max(n, 1) * ratio))));
    const rows = Math.max(1, Math.ceil(n / cols));
    const gridWidth = cols * CARD.width + (cols - 1) * GAP;
    const gridHeight = rows * CARD.height + (rows - 1) * GAP;
    const scale = Math.min(1, (stageArea.width - STAGE_PADDING * 2) / gridWidth, (stageArea.height - STAGE_PADDING * 2) / gridHeight);

    // Both layouts centre within their area; the grid also scales down to fit.
    const cellWidth = (CARD.width + GAP) * scale;
    const cellHeight = (CARD.height + GAP) * scale;
    const scaledWidth = cols * CARD.width * scale + (cols - 1) * GAP * scale;
    const scaledHeight = rows * CARD.height * scale + (rows - 1) * GAP * scale;
    const originX = (stageArea.width - scaledWidth) / 2;
    const originY = (stageArea.height - scaledHeight) / 2;

    return Array.from({ length: n }, (_, index) => {
        const fan: RevealPosition = {
            x: hand.slots[index].left + CARD.width / 2,
            y: containerTop + hand.slots[index].top + CARD.height,
            angle: hand.slots[index].angle,
            scale: 1,
        };
        const grid: RevealPosition = {
            x: originX + (index % cols) * cellWidth + (CARD.width * scale) / 2,
            y: originY + Math.floor(index / cols) * cellHeight + CARD.height * scale,
            angle: 0,
            scale,
        };
        return { fan, grid };
    });
}

const styles = StyleSheet.create({
    screen: {
        backgroundColor: Theme.background,
        flex: 1,
    },
    cardsLayer: {
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
        // Above the panel, so cards are never hidden as they move across it.
        zIndex: 1,
    },
    row: {
        flex: 1,
        flexDirection: 'row',
    },
    stage: {
        flex: 2,
    },
    panel: {
        flex: 1,
        gap: Spacing.lg,
        justifyContent: 'center',
        paddingHorizontal: Spacing.xxl,
        paddingVertical: Spacing.xxl,
    },
    copy: {
        gap: Spacing.sm,
    },
    line: {
        ...Type.bodyLarge,
    },
});
