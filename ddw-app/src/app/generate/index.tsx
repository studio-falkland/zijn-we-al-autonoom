// Generate screen: the reveal. The per-service providers are computed in the
// background, so the cards can be dealt in and turned over the moment the visitor
// arrives, with no waiting.

import { router } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FailureState } from '@/components/failure-state';
import { RevealStage } from '@/components/reveal/reveal-stage';
import { cardKey, useSessionStore } from '@/store/session';
import { Theme } from '@/theme/tokens';

export default function GenerateScreen() {
    const selected = useSessionStore((state) => state.selectedServices);
    const location = useSessionStore((state) => state.location);
    const cardData = useSessionStore((state) => state.cardData);
    const cardStatus = useSessionStore((state) => state.cardStatus);
    const cardError = useSessionStore((state) => state.cardError);
    const refreshCardData = useSessionStore((state) => state.refreshCardData);

    // The reveal closes on this: on to fusing the cards into the personal card.
    const handleContinue = useCallback(() => router.push('/fuse'), []);

    // Only trust data computed for the current selection and location.
    const ready = cardData !== null && cardData.key === cardKey(selected, location);

    return (
        <SafeAreaView style={styles.screen}>
            {cardStatus === 'error' ? (
                <FailureState message={cardError} onRetry={refreshCardData} />
            ) : cardData && ready ? (
                <RevealStage cards={cardData.providers} onContinue={handleContinue} />
            ) : null}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        backgroundColor: Theme.background,
        flex: 1,
    },
});
