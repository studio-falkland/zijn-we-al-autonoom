// The card's top section: a title with an optional subtitle beneath it, closed
// by a navy rule that separates it from the body. Set `divider={false}` for a
// header that should blend into the body.
import { StyleSheet, Text, View, type TextProps, type ViewProps } from 'react-native';

import { Colors, Spacing, Theme, Type } from '@/theme/tokens';

export function CardHeader({ divider = true, style, ...props }: ViewProps & { divider?: boolean }) {
    return <View style={[styles.header, divider && styles.divider, style]} {...props} />;
}

export function CardTitle({ style, ...props }: TextProps) {
    return <Text style={[styles.title, style]} {...props} />;
}

export function CardSubtitle({ style, ...props }: TextProps) {
    return <Text style={[styles.subtitle, style]} {...props} />;
}

const styles = StyleSheet.create({
    header: {
        gap: Spacing.xs,
        paddingBottom: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
    },
    divider: {
        borderBottomColor: Colors.blue[900],
        borderBottomWidth: 1,
    },
    title: {
        ...Type.sub,
    },
    subtitle: {
        ...Type.body,
        color: Theme.textMuted,
    },
});
