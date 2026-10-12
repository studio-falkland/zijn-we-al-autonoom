// A generic restart control for the kiosk.
//
// Pinned to the top-left of every screen, it asks for confirmation with the
// native dialog (a custom dialog comes later) and, on confirm, clears the
// visitor session and returns to the start for the next visitor.
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { useSessionStore } from '@/store/session';
import { Colors, Radii, Spacing } from '@/theme/tokens';

// The button's own size, and the horizontal space it reserves at the top-left
// (its margin + itself + a matching gap), so a sibling can sit just to its right.
const BUTTON_SIZE = 44;
export const RESTART_BUTTON_GUTTER = Spacing.md + BUTTON_SIZE + Spacing.md;

export function RestartButton() {
    const resetSession = useSessionStore((state) => state.resetSession);

    // Confirm first: a restart throws away the current visitor's choices.
    const handlePress = () => {
        Alert.alert('Restart?', 'This clears your choices and returns to the start.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Restart',
                style: 'destructive',
                onPress: () => {
                    resetSession();
                    router.replace('/');
                },
            },
        ]);
    };

    return (
        <Pressable onPress={handlePress} hitSlop={8} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            {/* The rotate-ccw glyph: an arc with a hooked arrowhead. */}
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path
                    d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                    stroke={Colors.blue[800]}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <Path
                    d="M3 3v5h5"
                    stroke={Colors.blue[800]}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </Svg>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: Colors.white,
        borderColor: Colors.blue[800],
        borderRadius: Radii.md,
        borderWidth: 1,
        height: BUTTON_SIZE,
        justifyContent: 'center',
        margin: Spacing.md,
        width: BUTTON_SIZE,
    },
    pressed: {
        backgroundColor: Colors.blue[50],
    },
});
