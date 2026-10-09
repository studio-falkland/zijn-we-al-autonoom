// The card's content region below the header. It grows to fill the card and
// clips its children to the card's rounded bottom corners — the container
// itself is left unclipped so its shadow stays intact. Add padding via `style`
// when the content should be inset; leave it off for edge-to-edge backgrounds.
import { useId } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { Defs, Path, Pattern, Rect, Svg } from 'react-native-svg';

import { Colors, Radii } from '@/theme/tokens';
import { CARD_BORDER_WIDTH } from './card-container';

// The inner corner radius: the surface's radius minus its border, so the body's
// clip follows the inside of the stroke.
const INNER_RADIUS = Radii.lg - CARD_BORDER_WIDTH;

export function CardBody({ style, ...props }: ViewProps) {
    return <View style={[styles.body, style]} {...props} />;
}

// Centres its child (an icon or small piece of artwork) in the body.
export function CardIcon({ style, ...props }: ViewProps) {
    return <View style={[styles.icon, style]} {...props} />;
}

// A diagonal hatch that fills its parent, drawn behind the card's content.
export function CardPatternedBackground({
    color = Colors.blue[800],
    gap = 12,
    strokeWidth = 1,
}: {
    /** Line colour. */
    color?: string;
    /** Spacing between the diagonal lines, in px. */
    gap?: number;
    /** Line thickness, in px. */
    strokeWidth?: number;
}) {
    // A per-instance id keeps several patterned cards independent. `useId`
    // emits punctuation that is awkward in an SVG id, so strip it.
    const patternId = `zwaa-card-hatch-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

    // The wrapper carries `pointerEvents` (react-native-svg's Svg omits it).
    return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Svg width="100%" height="100%">
                <Defs>
                    <Pattern id={patternId} patternUnits="userSpaceOnUse" width={gap} height={gap}>
                        <Path d={`M0 ${gap} L${gap} 0`} fill="none" stroke={color} strokeWidth={strokeWidth} />
                    </Pattern>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${patternId})`} />
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    body: {
        borderBottomLeftRadius: INNER_RADIUS,
        borderBottomRightRadius: INNER_RADIUS,
        flex: 1,
        overflow: 'hidden',
    },
    icon: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
});
