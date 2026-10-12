// The fuse stage. The gathered service cards converge from a grid and merge into
// the single personal A7 card. The panel carries the short copy, the interim
// print button (until printing is automated) and the continue action.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { A7_HEIGHT, A7_WIDTH } from '@/card/cardHtml';
import { Button } from '@/components/button';
import { MosaicCard } from '@/components/card/mosaic-card';
import { CARD_DIMENSIONS } from '@/components/organisation-card';
import { Treemap } from '@/components/treemap/treemap';
import type { MeasurementFrequency, ServiceProviders } from '@/data/dependencies';
import type { Language } from '@/i18n';
import { useTranslation } from '@/i18n/use-translation';
import { Spacing, Theme, Type } from '@/theme/tokens';

// The incoming card box, and the grid spacing around it.
const CARD = CARD_DIMENSIONS.medium;
const GAP = 24;
const PADDING = Spacing.lg;

// The timeline: hold the grid, then converge into the card.
const GATHER_HOLD = 800;
const FUSE_DURATION = 900;
const FUSE_STAGGER = 90;
const FUSE_SETTLE = 400;

export function FuseStage({
    cards,
    frequencies,
    place,
    printing,
    printed,
    error,
    onPrint,
    onContinue,
}: {
    cards: ServiceProviders[];
    frequencies: MeasurementFrequency[];
    place: string | null;
    printing: boolean;
    printed: boolean;
    error: string | null;
    onPrint: () => void;
    onContinue: () => void;
}) {
    const { t, language } = useTranslation();
    const [area, setArea] = useState<{ width: number; height: number } | null>(null);
    const [fused, setFused] = useState(false);
    const [ready, setReady] = useState(false);

    // Each incoming card's starting slot, fitted inside the stage.
    const slots = useMemo(() => (area ? gridSlots(cards.length, area) : []), [cards.length, area]);

    // Hold the grid, then fuse; the buttons unlock once it has settled.
    useEffect(() => {
        const converge = setTimeout(() => setFused(true), GATHER_HOLD);
        const settled = setTimeout(() => setReady(true), GATHER_HOLD + FUSE_DURATION + FUSE_SETTLE);
        return () => {
            clearTimeout(converge);
            clearTimeout(settled);
        };
    }, []);

    const handleLayout = useCallback((event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setArea({ width, height });
    }, []);

    return (
        <View style={styles.row}>
            {/* Left two-thirds: the cards converging into the personal card. */}
            <View style={styles.stage} onLayout={handleLayout}>
                {area && (
                    <>
                        {cards.map((card, index) => (
                            <FuseCard
                                key={card.service.slug}
                                card={card}
                                slot={slots[index]}
                                center={{ x: area.width / 2, y: area.height / 2 }}
                                fused={fused}
                                order={index}
                            />
                        ))}
                        <PersonalCard frequencies={frequencies} place={place} language={language} fused={fused} />
                    </>
                )}
            </View>
            {/* Right third: the copy and the two actions. */}
            <View style={styles.panel}>
                <View style={styles.copy}>
                    <Text style={styles.heading}>{t('fuse.heading')}</Text>
                    <Text style={styles.line}>{t('fuse.line')}</Text>
                </View>
                <Button
                    label={printing ? t('fuse.printing') : printed ? t('fuse.reprint') : t('fuse.print')}
                    onPress={onPrint}
                    disabled={printing || !ready}
                />
                <Button label={t('common.continue')} onPress={onContinue} disabled={!ready} />
                {error && <Text style={styles.error}>{error}</Text>}
            </View>
        </View>
    );
}

// One incoming card: it holds its slot, then shrinks and fades into the centre.
function FuseCard({
    card,
    slot,
    center,
    fused,
    order,
}: {
    card: ServiceProviders;
    slot: { x: number; y: number; scale: number };
    center: { x: number; y: number };
    fused: boolean;
    order: number;
}) {
    const x = useSharedValue(slot.x);
    const y = useSharedValue(slot.y);
    const scale = useSharedValue(slot.scale);
    const opacity = useSharedValue(1);

    // Each card leaves a beat after the one before, so the hand collapses inward.
    useEffect(() => {
        if (!fused) return;
        const delay = order * FUSE_STAGGER;
        x.value = withDelay(delay, withTiming(center.x, { duration: FUSE_DURATION }));
        y.value = withDelay(delay, withTiming(center.y, { duration: FUSE_DURATION }));
        scale.value = withDelay(delay, withTiming(0.2, { duration: FUSE_DURATION }));
        opacity.value = withDelay(delay, withTiming(0, { duration: FUSE_DURATION }));
    }, [fused, center, order, x, y, scale, opacity]);

    const motion = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            { translateX: x.value - CARD.width / 2 },
            { translateY: y.value - CARD.height / 2 },
            { scale: scale.value },
        ],
    }));

    return (
        <Animated.View style={[styles.absolute, motion]}>
            <MosaicCard frequencies={card.frequencies} width={CARD.width} height={CARD.height} />
        </Animated.View>
    );
}

// The personal A7 card, growing in as the incoming cards converge onto it.
function PersonalCard({
    frequencies,
    place,
    language,
    fused,
}: {
    frequencies: MeasurementFrequency[];
    place: string | null;
    language: Language;
    fused: boolean;
}) {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.6);
    useEffect(() => {
        if (!fused) return;
        opacity.value = withDelay(300, withTiming(1, { duration: FUSE_DURATION }));
        scale.value = withDelay(300, withTiming(1, { duration: FUSE_DURATION }));
    }, [fused, opacity, scale]);

    const motion = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));
    if (frequencies.length === 0) return null;

    return (
        <Animated.View style={[styles.absolute, styles.centered, motion]}>
            <Treemap frequencies={frequencies} width={A7_WIDTH} height={A7_HEIGHT} context={{ place, language }} />
        </Animated.View>
    );
}

// A fitted grid of card centres inside the stage area, scaled to fit.
function gridSlots(n: number, area: { width: number; height: number }) {
    const ratio = (area.width / area.height) * (CARD.height / CARD.width);
    const cols = Math.max(1, Math.min(Math.max(n, 1), Math.round(Math.sqrt(Math.max(n, 1) * ratio))));
    const rows = Math.max(1, Math.ceil(n / cols));
    const gridWidth = cols * CARD.width + (cols - 1) * GAP;
    const gridHeight = rows * CARD.height + (rows - 1) * GAP;
    const scale = Math.min(1, (area.width - PADDING * 2) / gridWidth, (area.height - PADDING * 2) / gridHeight);

    // The scaled cell and the grid's centred origin.
    const cellWidth = (CARD.width + GAP) * scale;
    const cellHeight = (CARD.height + GAP) * scale;
    const scaledWidth = cols * CARD.width * scale + (cols - 1) * GAP * scale;
    const scaledHeight = rows * CARD.height * scale + (rows - 1) * GAP * scale;
    const originX = (area.width - scaledWidth) / 2;
    const originY = (area.height - scaledHeight) / 2;

    return Array.from({ length: n }, (_, index) => ({
        x: originX + (index % cols) * cellWidth + (CARD.width * scale) / 2,
        y: originY + Math.floor(index / cols) * cellHeight + (CARD.height * scale) / 2,
        scale,
    }));
}

const styles = StyleSheet.create({
    row: {
        flex: 1,
        flexDirection: 'row',
    },
    stage: {
        flex: 2,
    },
    absolute: {
        left: 0,
        position: 'absolute',
        top: 0,
    },
    centered: {
        alignItems: 'center',
        bottom: 0,
        justifyContent: 'center',
        right: 0,
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
    heading: {
        ...Type.sub,
    },
    line: {
        ...Type.body,
    },
    error: {
        ...Type.bodySmall,
        color: Theme.danger,
    },
});
