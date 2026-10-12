// The reveal stage. The gathered service cards deal into a fan and settle into a
// grid on the left two-thirds; the visitor then steps through three button-gated
// phases on the right third: turn the cards over onto their provider mosaics
// (Reveal), recolour the US providers red (Shut them down), then finish.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { Button } from '@/components/button';
import { CARD_DIMENSIONS } from '@/components/organisation-card';
import { isUSFrequency } from '@/components/treemap/patternDefs';
import { RECOLOR_DURATION } from '@/components/treemap/mosaic';
import type { ServiceProviders } from '@/data/dependencies';
import { buildTreemapLayout } from '@/treemap/layout';
import { Spacing, Type } from '@/theme/tokens';
import { MOSAIC_SIZE, RevealCard, type RevealPosition } from './reveal-card';

// Card metrics, kept in step with the reveal card's own box.
const CARD = CARD_DIMENSIONS.medium;

// Grid spacing, and the fan's spread, tilt and edge drop.
const GAP = 24;
const FAN_ANGLE = 8;
const FAN_DROP = 16;

// The timeline: long gaps between steps, short moves within them.
const FAN_HOLD = 900;
const MOVE_DURATION = 600;
const GRID_SETTLE = 350;
const FLIP_STAGGER = 450;
const FLIP_DURATION = 320;
const POST_FLIP_HOLD = 500;
const RECOLOR_STAGGER = 360;
const POST_RECOLOR_HOLD = 600;

// The copy per phase. The visitor moves between phases with the panel's button.
const COPY = {
    preTurn: [
        'Your daily life relies so much on these services.',
        'These services themselves also rely on digital infrastructures.',
        'Let’s reveal how they depend on these infrastructures.',
    ],
    preColor: ['Have you seen some familiar names? What if someone turned them off?'],
    postColor: ['How much of your daily life remains?'],
} as const;

// The phase the reveal is in: settling, waiting on Reveal, turning, waiting on
// Shut them down, recolouring, or finished.
type Stage = 'grid' | 'ready-reveal' | 'turning' | 'ready-shutdown' | 'shutting' | 'done';

export function RevealStage({ cards, onContinue }: { cards: ServiceProviders[]; onContinue: () => void }) {
    const [size, setSize] = useState<{ width: number; height: number } | null>(null);
    const [stage, setStage] = useState<Stage>('grid');
    const [grid, setGrid] = useState(false);
    const [flipped, setFlipped] = useState(0);
    const [revealedUS, setRevealedUS] = useState(0);

    // Each card's tiles, the US recolour order, and the shared fan/grid box.
    const plan = useMemo(() => planReveal(cards), [cards]);

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
        const timers = Array.from({ length: plan.usCount }, (_, index) =>
            setTimeout(() => setRevealedUS(index + 1), index * RECOLOR_STAGGER),
        );
        const tail = Math.max(plan.usCount - 1, 0) * RECOLOR_STAGGER + RECOLOR_DURATION + POST_RECOLOR_HOLD;
        timers.push(setTimeout(() => setStage('done'), tail));
        return () => timers.forEach((timer) => clearTimeout(timer));
    }, [stage, plan.usCount]);

    // The visible stage area, used to scale the shared box to fit.
    const handleLayout = useCallback((event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setSize({ width, height });
    }, []);

    const scale = size ? fitScale(size, plan.box) : 0;
    const panel = panelFor(stage, { reveal: () => setStage('turning'), shutdown: () => setStage('shutting'), onContinue });

    return (
        <View style={styles.row}>
            {/* Left two-thirds: the card grid, scaled to fit. */}
            <View style={styles.stage} onLayout={handleLayout}>
                {size && (
                    <View style={[styles.box, { height: plan.box.height, width: plan.box.width, transform: [{ scale }] }]}>
                        {cards.map((card, index) => (
                            <RevealCard
                                key={card.service.slug}
                                card={card}
                                rects={plan.cards[index].rects}
                                tileOrder={plan.cards[index].tileOrder}
                                flipped={index < flipped}
                                revealedUS={revealedUS}
                                position={plan.positions[index]}
                                grid={grid}
                            />
                        ))}
                    </View>
                )}
            </View>
            {/* Right third: the phase copy, sitting above the phase's action. */}
            <View style={styles.panel}>
                <View style={styles.copy}>
                    {panel.copy.map((line) => (
                        <Text key={line} style={styles.line}>
                            {line}
                        </Text>
                    ))}
                </View>
                <Button label={panel.label} onPress={panel.onPress} disabled={panel.disabled} />
            </View>
        </View>
    );
}

// The copy, action label and callback for the current phase.
function panelFor(
    stage: Stage,
    actions: { reveal: () => void; shutdown: () => void; onContinue: () => void },
): { copy: readonly string[]; label: string; onPress: () => void; disabled: boolean } {
    if (stage === 'done') {
        return { copy: COPY.postColor, label: 'Continue', onPress: actions.onContinue, disabled: false };
    }
    if (stage === 'ready-shutdown' || stage === 'shutting') {
        return { copy: COPY.preColor, label: 'Shut them down', onPress: actions.shutdown, disabled: stage !== 'ready-shutdown' };
    }
    return { copy: COPY.preTurn, label: 'Reveal', onPress: actions.reveal, disabled: stage !== 'ready-reveal' };
}

// Each card's mosaic, the global US recolour order, and the fan/grid positions.
function planReveal(cards: ServiceProviders[]) {
    // A running counter hands each US tile its slot in the blue-to-red sequence.
    let usCount = 0;
    const laid = cards.map((card) => {
        const rects = buildTreemapLayout(card.frequencies, MOSAIC_SIZE.width, MOSAIC_SIZE.height);
        const tileOrder = rects.map((rect) => (isUSFrequency(rect.frequency) ? usCount++ : null));
        return { rects, tileOrder };
    });
    const slots = fanAndGrid(cards.length);
    return { cards: laid, usCount, box: slots.box, positions: slots.cards };
}

// The fan and grid slots for n cards, both inside one box they share.
function fanAndGrid(n: number) {
    const cols = Math.max(1, Math.ceil(Math.sqrt(n)));
    const rows = Math.max(1, Math.ceil(n / cols));
    const gridWidth = cols * CARD.width + (cols - 1) * GAP;
    const gridHeight = rows * CARD.height + (rows - 1) * GAP;

    // The fan span never exceeds the grid width, so both layouts share one box.
    const fanStep = n > 1 ? Math.min(CARD.width * 0.5, (gridWidth - CARD.width) / (n - 1)) : 0;
    const fanWidth = CARD.width + fanStep * Math.max(n - 1, 0);
    const margin = CARD.width * 0.18;
    const box = {
        width: gridWidth + margin * 2,
        height: Math.max(gridHeight, CARD.height + FAN_DROP * 2) + margin * 2,
    };

    // Both layouts centre themselves inside the box's inner area.
    const innerWidth = box.width - margin * 2;
    const innerHeight = box.height - margin * 2;
    const mid = (n - 1) / 2;

    const cards = Array.from({ length: n }, (_, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const grid: RevealPosition = {
            x: margin + (innerWidth - gridWidth) / 2 + col * (CARD.width + GAP),
            y: margin + (innerHeight - gridHeight) / 2 + row * (CARD.height + GAP),
            angle: 0,
        };
        const angle = n > 1 ? (FAN_ANGLE * (index - mid)) / Math.max(mid, 1) : 0;
        const fan: RevealPosition = {
            x: margin + (innerWidth - fanWidth) / 2 + index * fanStep,
            y: margin + (innerHeight - CARD.height) / 2 + (FAN_DROP * Math.abs(angle)) / FAN_ANGLE,
            angle,
        };
        return { fan, grid };
    });
    return { box, cards };
}

// The scale that fits the shared box inside the measured stage.
function fitScale(size: { width: number; height: number }, box: { width: number; height: number }) {
    return Math.min(1, size.width / box.width, size.height / box.height);
}

const styles = StyleSheet.create({
    row: {
        flex: 1,
        flexDirection: 'row',
    },
    stage: {
        alignItems: 'center',
        flex: 2,
        justifyContent: 'center',
        overflow: 'hidden',
        padding: Spacing.lg,
    },
    box: {
        position: 'relative',
    },
    panel: {
        flex: 1,
        gap: Spacing.lg,
        justifyContent: 'flex-end',
        paddingBottom: Spacing.xxl,
        paddingHorizontal: Spacing.xxl,
        paddingTop: Spacing.xxl,
    },
    copy: {
        gap: Spacing.sm,
    },
    line: {
        ...Type.bodyLarge,
    },
});
