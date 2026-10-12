// A two-faced card that turns over about its Y axis: the front shows until
// `flipped`, then the back. Each face hides its reverse, so only one side is
// ever visible mid-turn.

import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

// The turn's depth; without perspective the flip reads as a flat squash.
const PERSPECTIVE = 1000;

export function FlipCard({
    flipped,
    duration,
    style,
    front,
    back,
}: {
    flipped: boolean;
    duration: number;
    style?: StyleProp<ViewStyle>;
    front: ReactNode;
    back: ReactNode;
}) {
    // Progress runs 0 (front) to 1 (back); both faces read from the same value.
    const progress = useSharedValue(flipped ? 1 : 0);
    useEffect(() => {
        progress.value = withTiming(flipped ? 1 : 0, { duration });
    }, [flipped, duration, progress]);

    // The back sits half a turn behind the front, so one always faces the viewer.
    const frontStyle = useAnimatedStyle(() => ({
        transform: [{ perspective: PERSPECTIVE }, { rotateY: `${progress.value * 180}deg` }],
    }));
    const backStyle = useAnimatedStyle(() => ({
        transform: [{ perspective: PERSPECTIVE }, { rotateY: `${progress.value * 180 + 180}deg` }],
    }));

    return (
        <View style={style}>
            <Animated.View style={[styles.face, frontStyle]}>{front}</Animated.View>
            <Animated.View style={[styles.face, backStyle]}>{back}</Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    face: {
        backfaceVisibility: 'hidden',
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
    },
});
