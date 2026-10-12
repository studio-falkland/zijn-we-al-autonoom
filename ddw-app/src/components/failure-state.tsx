// A shared failure state: the error and a retry, shown when the background card
// computation fails on the reveal, fuse or outro screens.

import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { useTranslation } from '@/i18n/use-translation';
import { Spacing, Theme, Type } from '@/theme/tokens';

export function FailureState({ message, onRetry }: { message: string | null; onRetry: () => void }) {
    const { t } = useTranslation();

    return (
        <View style={styles.wrap}>
            <Text style={styles.title}>{t('failure.title')}</Text>
            {message && <Text style={styles.message}>{message}</Text>}
            <Button label={t('failure.retry')} onPress={onRetry} />
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
    title: {
        ...Type.sub,
    },
    message: {
        ...Type.body,
        color: Theme.textMuted,
        textAlign: 'center',
    },
});
