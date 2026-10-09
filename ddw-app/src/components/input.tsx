// A generic single-line text input, styled to match the website's inputs:
// white surface, ink stroke, and the brand's hard offset shadow. An optional
// leading `icon` is drawn inside the field on the left. Forwards all TextInput
// props (and its ref) so callers keep full control.
import { forwardRef, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Colors, Radii, Shadows, Spacing } from '@/theme/tokens';

export type InputProps = TextInputProps & {
    /** Optional leading icon, drawn inside the field on the left. */
    icon?: ReactNode;
};

export const Input = forwardRef<TextInput, InputProps>(function Input({ icon, style, ...props }, ref) {
    return (
        <View>
            {/* The icon overlays the field on the left and must not steal taps. */}
            {icon ? (
                <View style={styles.icon} pointerEvents="none">
                    {icon}
                </View>
            ) : null}
            <TextInput ref={ref} style={[styles.input, icon ? styles.withIcon : null, style]} {...props} />
        </View>
    );
});

const styles = StyleSheet.create({
    icon: {
        bottom: 0,
        justifyContent: 'center',
        left: Spacing.md,
        position: 'absolute',
        top: 0,
        zIndex: 1,
    },
    input: {
        backgroundColor: Colors.white,
        borderColor: Colors.blue[800],
        borderRadius: Radii.md,
        borderWidth: 1,
        color: Colors.blue[900],
        fontSize: 20,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        ...Shadows.boxSmall,
    },
    // Extra left padding so the text clears the leading icon.
    withIcon: {
        paddingLeft: Spacing.xxl,
    },
});
