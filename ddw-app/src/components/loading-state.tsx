// A shared loading state: a spinner and a short label, shown while the card
// artwork and PDF are prepared on the reveal and fuse screens.

import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '@/i18n/use-translation';
import { Spacing, Theme, Type } from '@/theme/tokens';

export function LoadingState() {
    const { t } = useTranslation();

    return (
        <View style={styles.wrap}>
            <ActivityIndicator color={Theme.primary} size="large" />
            <Text style={styles.label}>{t('common.loading')}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        alignItems: 'center',
        flex: 1,
        gap: Spacing.lg,
        justifyContent: 'center',
        paddingHorizontal: Spacing.xxxl,
    },
    label: {
        ...Type.body,
        color: Theme.textMuted,
        textAlign: 'center',
    },
});
