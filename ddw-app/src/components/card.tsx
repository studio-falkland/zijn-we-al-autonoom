// A generic surface: a white card with an ink stroke and the brand's hard
// offset shadow. Takes any View props, so callers can adjust spacing/layout.
import { StyleSheet, View, type ViewProps } from 'react-native';

import { Colors, Radii, Shadows, Spacing } from '@/theme/tokens';

export function Card({ style, ...props }: ViewProps) {
    return <View style={[styles.card, style]} {...props} />;
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        borderColor: Colors.blue[800],
        borderRadius: Radii.lg,
        borderWidth: 1,
        padding: Spacing.md,
        ...Shadows.box,
    },
});
