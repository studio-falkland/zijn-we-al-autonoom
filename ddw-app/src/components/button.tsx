// Primary button used across the kiosk screens.
import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors, Shadows, Spacing, Type } from '@/theme/tokens';

// A full-width kiosk button; disabled state for blocked steps.
export function Button({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}
        >
            <Text style={styles.label}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: Colors.blue[500],
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        ...Shadows.drop,
    },
    pressed: {
        backgroundColor: Colors.blue[700],
    },
    disabled: {
        opacity: 0.4,
    },
    label: {
        ...Type.sub,
        color: '#FFFFFF',
        textAlign: 'center',
    },
});
