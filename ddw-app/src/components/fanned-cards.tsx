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
import { fanLayout } from './fan-layout';
import type { SelectedService } from '@/data/services';

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
    // The hand's geometry comes from the shared fan layout, so it matches the
    // reveal screen's opening fan exactly.
    const { height, slots } = useMemo(
        () => fanLayout({ count, width, cardWidth, cardHeight, maxAngle }),
        [count, width, cardWidth, cardHeight, maxAngle],
    );

    return (
        <View style={[styles.container, { height }]} onLayout={handleLayout}>
            {width > 0 &&
                organisations.map((organisation, index) => {
                    const slot = slots[index];
                    const isFocused = focused === organisation.slug;

                    return (
                        <FanCard
                            key={organisation.slug}
                            organisation={organisation}
                            size={size}
                            angle={slot.angle}
                            left={slot.left}
                            top={slot.top}
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
