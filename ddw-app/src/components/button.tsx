// Primary button used across the kiosk screens.
import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors, Radii, Spacing, Type } from '@/theme/tokens';

// A full-width kiosk button; disabled state for blocked steps. `size="small"`
// tightens the label and padding for compact panels.
export function Button({
    label,
    onPress,
    disabled,
    size = 'medium',
}: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    size?: 'medium' | 'small';
}) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [
                styles.button,
                size === 'small' && styles.buttonSmall,
                pressed && styles.pressed,
                disabled && styles.disabled,
            ]}
        >
            <Text style={[styles.label, size === 'small' && styles.labelSmall]}>{label}</Text>
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
    buttonSmall: {
        paddingVertical: Spacing.sm,
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
    labelSmall: {
        fontSize: 20,
        lineHeight: 20,
    },
    labelDisabled: {
        color: Colors.grey[200],
    }
});
