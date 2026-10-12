// A fanned hand of organisation cards, laid out along a shallow arc.
//
// Generic and self-measuring: it arranges any list of organisations, reads its
// own width and tightens the overlap to fit, so it works in a 2/3 column or full
// width. Cards rise in from the bottom and drop back out to the bottom, and
// tapping one brings it forward (scaled up) to reveal its delete control.
//
// Each card tilts about its own bottom centre, so the tops fan out while the
// bottoms line up — a stable fan rather than cards sliding about by eye.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
    LinearTransition,
    SlideInDown,
    SlideOutDown,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { CARD_DIMENSIONS, OrganisationCard, type OrganisationCardSize } from '@/components/organisation-card';
import type { SelectedService } from '@/data/services';
import { Spacing } from '@/theme/tokens';

// The tightest horizontal step, so a sliver of every card stays visible.
const MIN_STEP = 12;
// The most a card may advance per step, so even a small hand overlaps.
const MAX_STEP_RATIO = 0.6;
// How far the outermost cards dip below the centre, as a fraction of the card
// width — the extra dip that makes the hand read as a fan.
const DROP_RATIO = 0.14;
// A focused card grows and lifts by this much, over this long.
const FOCUS_SCALE = 1.06;
const FOCUS_LIFT = 28;
const FOCUS_DURATION = 150;
// How long the hand takes to re-fan (position and tilt) when a card comes or goes.
const REFLOW_DURATION = 250;
const REFLOW = LinearTransition.duration(REFLOW_DURATION);

// One card in the hand: absolutely placed and tilted, and animated when focused.
function FanCard({
    organisation,
    size,
    angle,
    left,
    top,
    zIndex,
    focused,
    onFocus,
    onRemove,
}: {
    organisation: SelectedService;
    size: OrganisationCardSize;
    angle: number;
    left: number;
    top: number;
    zIndex: number;
    focused: boolean;
    onFocus: () => void;
    onRemove?: (organisation: SelectedService) => void;
}) {
    // The focus scale and lift, and the tilt, are shared so all three ease into
    // place: the card rises when focused, and re-tilts as the hand re-fans.
    const scale = useSharedValue(1);
    const lift = useSharedValue(0);
    const rotation = useSharedValue(angle);
    useEffect(() => {
        scale.value = withTiming(focused ? FOCUS_SCALE : 1, { duration: FOCUS_DURATION });
        lift.value = withTiming(focused ? FOCUS_LIFT : 0, { duration: FOCUS_DURATION });
    }, [focused, scale, lift]);
    useEffect(() => {
        rotation.value = withTiming(angle, { duration: REFLOW_DURATION });
    }, [angle, rotation]);

    // Rotate about the card's bottom centre, so all cards pivot from a common line.
    const pivot = CARD_DIMENSIONS[size].height / 2;
    const tilt = useAnimatedStyle(() => ({
        transform: [
            { translateY: -lift.value },
            { translateY: pivot },
            { rotate: `${rotation.value}deg` },
            { translateY: -pivot },
            { scale: scale.value },
        ],
    }));

    return (
        <Animated.View
            entering={SlideInDown}
            exiting={SlideOutDown}
            layout={REFLOW}
            style={[styles.card, { left, top, zIndex }]}
        >
            <Animated.View style={tilt}>
                <Pressable onPress={onFocus}>
                    <OrganisationCard
                        organisation={organisation}
                        size={size}
                        onDelete={focused && onRemove ? () => onRemove(organisation) : undefined}
                    />
                </Pressable>
            </Animated.View>
        </Animated.View>
    );
}

export function FannedCards({
    organisations,
    onRemove,
    size = 'small',
    maxAngle = 10,
}: {
    organisations: SelectedService[];
    /** When given, the focused card shows a delete control that calls this. */
    onRemove?: (organisation: SelectedService) => void;
    /** Card scale. */
    size?: OrganisationCardSize;
    /** Rotation of the outermost cards, in degrees. */
    maxAngle?: number;
}) {
    const [width, setWidth] = useState(0);
    const [focused, setFocused] = useState<string | null>(null);

    const { width: cardWidth, height: cardHeight } = CARD_DIMENSIONS[size];

    const handleLayout = useCallback((event: LayoutChangeEvent) => {
        setWidth(event.nativeEvent.layout.width);
    }, []);

    const count = organisations.length;
    // The arc only makes sense with more than one card and a non-zero angle.
    const usesArc = count > 1 && maxAngle > 0;
    const rad = (Math.abs(maxAngle) * Math.PI) / 180;
    const halfWidth = cardWidth / 2;

    // A tilt about the bottom centre swings the top corners out past the card's
    // own box, so inset the hand by that swing on each side to stay on screen.
    const overhang = usesArc ? cardHeight * Math.sin(rad) : 0;
    const usableWidth = Math.max(cardWidth, width - overhang * 2);

    // The horizontal step between card origins: tighter as the hand grows.
    const step = useMemo(() => {
        if (count <= 1) return 0;
        const spread = (usableWidth - cardWidth) / (count - 1);
        return Math.max(MIN_STEP, Math.min(cardWidth * MAX_STEP_RATIO, spread));
    }, [count, usableWidth, cardWidth]);

    const span = cardWidth + step * Math.max(count - 1, 0);
    const leftStart = overhang + Math.max(0, (usableWidth - span) / 2);

    // The same tilt also lifts a top corner and drops a bottom corner, so reserve
    // both; and the edges dip below the centre so the hand reads as a fan.
    const topLift = usesArc ? Math.max(0, halfWidth * Math.sin(rad) - cardHeight * (1 - Math.cos(rad))) : 0;
    const bottomDrop = usesArc ? halfWidth * Math.sin(rad) : 0;
    const fanDrop = usesArc ? cardWidth * DROP_RATIO : 0;
    const height = cardHeight + topLift + bottomDrop + fanDrop + Spacing.sm;

    return (
        <View style={[styles.container, { height }]} onLayout={handleLayout}>
            {width > 0 &&
                organisations.map((organisation, index) => {
                    const middle = (count - 1) / 2;
                    const angle = usesArc ? (maxAngle * (index - middle)) / middle : 0;
                    const dip = usesArc ? fanDrop * (Math.abs(angle) / maxAngle) : 0;
                    const isFocused = focused === organisation.slug;

                    return (
                        <FanCard
                            key={organisation.slug}
                            organisation={organisation}
                            size={size}
                            angle={angle}
                            left={leftStart + index * step}
                            top={topLift + dip}
                            // The focused card floats above the rest of the hand.
                            zIndex={isFocused ? count + 1 : index}
                            focused={isFocused}
                            onFocus={() => setFocused(isFocused ? null : organisation.slug)}
                            onRemove={
                                onRemove
                                    ? (removed) => {
                                          setFocused(null);
                                          onRemove(removed);
                                      }
                                    : undefined
                            }
                        />
                    );
                })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        width: '100%',
    },
    card: {
        position: 'absolute',
    },
});
