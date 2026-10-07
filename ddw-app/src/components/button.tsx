// Primary button used across the kiosk screens.
import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors, Radii, Spacing, Type } from '@/theme/tokens';

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
        backgroundColor: Colors.blue[700],
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderRadius: Radii.lg,
    },
    pressed: {
        backgroundColor: Colors.blue[800],
    },
    disabled: {
        backgroundColor: Colors.grey[700],
    },
    label: {
        ...Type.sub,
        color: Colors.white,
        textAlign: 'center',
        fontWeight: 400,
    },
    labelDisabled: {
        color: Colors.grey[200],
    }
});
