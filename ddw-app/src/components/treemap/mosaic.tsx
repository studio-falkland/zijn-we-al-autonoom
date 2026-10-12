// One provider tile inside a service card's mosaic, drawn with the shared vector
// patterns and the US rule from patternDefs. Every tile is labelled, and a US
// provider's tile fades from blue to red when the reveal cues it.

import { useEffect, useId } from 'react';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { ClipPath, G, Rect, Text } from 'react-native-svg';

import { truncateLabel } from '@/treemap/label';
import type { TreemapRect } from '@/treemap/layout';
import { Colors, Fonts } from '@/theme/tokens';
import { isUSFrequency, PatternMatcher } from './patternDefs';

// The leaf fills, matching the A7 card and the web app.
const LEAF_BLUE = '#0000FF';
const LEAF_RED = '#FF0000';
const LEAF_BASE = '#F6F6FF';

// How long a US tile takes to turn red once it is cued.
export const RECOLOR_DURATION = 220;

// A rect whose props are driven from the UI thread (the red overlay's opacity).
const AnimatedRect = Animated.createAnimatedComponent(Rect);

export function MosaicTile({ rect, revealed }: { rect: TreemapRect; revealed: boolean }) {
    // A per-tile id keeps the clip and plate ids unique within the card's SVG.
    const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
    const us = isUSFrequency(rect.frequency);
    const mask = PatternMatcher(rect.frequency);

    // The red overlay: held at 0 until cued, then faded in. Only US tiles use it.
    const red = useSharedValue(0);
    useEffect(() => {
        if (us) red.value = withTiming(revealed ? 1 : 0, { duration: RECOLOR_DURATION });
    }, [us, revealed, red]);
    const redProps = useAnimatedProps(() => ({ opacity: red.value }));

    // Labels only fit the larger tiles; a sliver of a provider stays unlabelled.
    const labelled = rect.width >= 56 && rect.height >= 30;
    const label = labelled ? truncateLabel(rect.frequency.category, rect.width - 20) : null;

    return (
        <G>
            {/* The base and the patterned blue fill, clipped to the tile. */}
            <ClipPath id={`clip-${uid}`}>
                <Rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} />
            </ClipPath>
            <Rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx={4} fill={LEAF_BASE} />
            <Rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx={4} fill={LEAF_BLUE} mask={mask} />
            {/* The red face, layered over the blue and faded in on cue. */}
            {us && (
                <AnimatedRect
                    x={rect.x}
                    y={rect.y}
                    width={rect.width}
                    height={rect.height}
                    rx={4}
                    fill={LEAF_RED}
                    mask={mask}
                    animatedProps={redProps}
                />
            )}
            {label && <TileLabel uid={uid} rect={rect} label={label} />}
        </G>
    );
}

// The label plate: pale blue across the tile with the provider name centred.
function TileLabel({ uid, rect, label }: { uid: string; rect: TreemapRect; label: string }) {
    const plateHeight = 20;
    const plateX = rect.x + 8;
    const plateY = rect.y + rect.height / 2 - plateHeight / 2;
    const plateWidth = rect.width - 16;

    return (
        <G>
            <ClipPath id={`plate-${uid}`}>
                <Rect x={plateX} y={plateY} width={plateWidth} height={plateHeight} rx={4} />
            </ClipPath>
            {/* The plate clips the name to itself, so it never exceeds the tile. */}
            <Rect
                x={plateX}
                y={plateY}
                width={plateWidth}
                height={plateHeight}
                rx={4}
                fill={Colors.blue[50]}
                clipPath={`url(#clip-${uid})`}
            />
            <Text
                x={rect.x + rect.width / 2}
                y={rect.y + rect.height / 2 + 4}
                fontSize={11}
                fontWeight="400"
                fill={Colors.blue[900]}
                textAnchor="middle"
                clipPath={`url(#plate-${uid})`}
                fontFamily={Fonts.family}
            >
                {label}
            </Text>
        </G>
    );
}
