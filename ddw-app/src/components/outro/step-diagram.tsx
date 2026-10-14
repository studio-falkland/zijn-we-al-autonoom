// The outro's four-step diagram: each step pairs a small illustration with a navy
// pill label, linked by arrows into a sequence. The card illustrations use the
// visitor's own card, and the steps appear one by one.

import { Fragment, type ReactNode } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Path, Polygon, Svg } from 'react-native-svg';

import Installation from '@/assets/images/installation-visualisation.svg';
import { MapCard } from '@/components/card/map-card';
import { MosaicCard } from '@/components/card/mosaic-card';
import type { MeasurementFrequency } from '@/data/dependencies';
import { useTranslation } from '@/i18n/use-translation';
import { Colors, Radii, Spacing } from '@/theme/tokens';
import { StepPill } from './step-pill';

// The card illustration box, the wider installation scene, and the A7 card.
const ICON = { width: 96, height: 136 };
const SCENE = { width: 190, height: 136 };
const A7 = { width: 210, height: 298 };
const FIT = ICON.width / A7.width;

// How long after one item appears the next one follows.
const STEP_DELAY = 220;

export function StepDiagram({
    frequencies,
    place,
    center,
}: {
    frequencies: MeasurementFrequency[];
    place: string | null;
    center: [number, number] | null;
}) {
    const { t, language } = useTranslation();

    const steps: { key: string; label: string; icon: ReactNode }[] = [
        { key: 'guidance', label: t('steps.guidance'), icon: <GuidanceCard /> },
        {
            key: 'personal',
            label: t('steps.personal'),
            icon: (
                <ScaledCard>
                    <MapCard width={A7.width} height={A7.height} place={place} center={center} language={language} />
                </ScaledCard>
            ),
        },
        {
            key: 'pin',
            label: t('steps.pin'),
            icon: (
                <ScaledCard>
                    <MosaicCard frequencies={frequencies} width={A7.width} height={A7.height} />
                </ScaledCard>
            ),
        },
        { key: 'share', label: t('steps.share'), icon: <InstallationScene /> },
    ];

    return (
        <View style={styles.row}>
            {steps.map((step, index) => (
                <Fragment key={step.key}>
                    {/* An arrow links each step to the one before it. */}
                    {index > 0 && (
                        <Reveal index={index * 2 - 1}>
                            <ArrowSlot />
                        </Reveal>
                    )}
                    <Reveal index={index * 2}>
                        <Step label={step.label}>{step.icon}</Step>
                    </Reveal>
                </Fragment>
            ))}
        </View>
    );
}

// Fades a diagram item in after the ones before it.
function Reveal({ index, children }: { index: number; children: ReactNode }) {
    return <Animated.View entering={FadeInUp.delay(index * STEP_DELAY)}>{children}</Animated.View>;
}

// One step: its illustration above the label.
function Step({ label, children }: { label: string; children: ReactNode }) {
    return (
        <View style={styles.step}>
            {children}
            <StepPill label={label} />
        </View>
    );
}

// An arrow, centred in the illustration band so it lines up with the icons.
function ArrowSlot() {
    return (
        <View style={styles.arrowSlot}>
            <Svg width={28} height={14} viewBox="0 0 28 14">
                <Path d="M0 7H19" stroke={Colors.blue[800]} strokeWidth={2} />
                <Polygon points="28,7 17,2 17,12" fill={Colors.blue[800]} />
            </Svg>
        </View>
    );
}

// The A7 artwork, scaled down to the illustration box.
function ScaledCard({ children }: { children: ReactNode }) {
    return (
        <View style={styles.icon}>
            <View style={{ transform: [{ scale: FIT }] }}>{children}</View>
        </View>
    );
}

// The guidance card: a blank card with placeholder bars.
function GuidanceCard() {
    return (
        <View style={[styles.icon, styles.guidance]}>
            <View style={[styles.bar, { width: '70%' }]} />
            <View style={[styles.bar, { width: '45%' }]} />
            <View style={styles.block} />
            <View style={[styles.bar, { width: '55%' }]} />
            <View style={[styles.bar, { width: '80%' }]} />
        </View>
    );
}

// The installation scene: the map with the visitor's and others' cards around it.
function InstallationScene() {
    return (
        <View style={styles.scene}>
            <Image source={Installation} style={styles.installation} contentFit="contain" />
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        alignItems: 'flex-start',
        flexDirection: 'row',
        gap: Spacing.md,
    },
    step: {
        alignItems: 'center',
        gap: Spacing.md,
    },
    icon: {
        alignItems: 'center',
        height: ICON.height,
        justifyContent: 'center',
        width: ICON.width,
    },
    scene: {
        alignItems: 'center',
        height: SCENE.height,
        justifyContent: 'center',
        width: SCENE.width,
    },
    installation: {
        height: (SCENE.width * 107) / 296,
        width: SCENE.width,
    },
    arrowSlot: {
        alignItems: 'center',
        height: ICON.height,
        justifyContent: 'center',
        width: 28,
    },
    guidance: {
        backgroundColor: Colors.white,
        borderColor: Colors.blue[800],
        borderRadius: Radii.lg,
        borderWidth: 2,
        gap: Spacing.sm,
        padding: Spacing.md,
    },
    bar: {
        backgroundColor: Colors.blue[200],
        borderRadius: Radii.md,
        height: 8,
    },
    block: {
        backgroundColor: Colors.blue[50],
        borderColor: Colors.blue[200],
        borderRadius: Radii.md,
        borderWidth: 1,
        height: 42,
        width: '100%',
    },
});
