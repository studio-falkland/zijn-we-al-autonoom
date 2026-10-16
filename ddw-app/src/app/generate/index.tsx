// Generate screen: the reveal. The per-service providers are computed in the
// background, so the cards can be dealt in and turned over the moment the visitor
// arrives, with no waiting. The card's PDF is sent to the printer as soon as it is
// ready, so the job runs while the visitor watches the reveal.

import { router } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FailureState } from '@/components/failure-state';
import { LoadingState } from '@/components/loading-state';
import { RevealStage } from '@/components/reveal/reveal-stage';
import { usePrinterStore } from '@/store/printer';
import { cardKey, useSessionStore } from '@/store/session';
import { Theme } from '@/theme/tokens';

export default function GenerateScreen() {
    const selected = useSessionStore((state) => state.selectedServices);
    const location = useSessionStore((state) => state.location);
    const cardData = useSessionStore((state) => state.cardData);
    const cardStatus = useSessionStore((state) => state.cardStatus);
    const cardError = useSessionStore((state) => state.cardError);
    const generatedCard = useSessionStore((state) => state.generatedCard);
    const setPrintStatus = useSessionStore((state) => state.setPrintStatus);
    const refreshCardData = useSessionStore((state) => state.refreshCardData);
    const printPdf = usePrinterStore((state) => state.printPdf);

    // The reveal closes on this: on to fusing the cards into the personal card.
    const handleContinue = useCallback(() => router.push('/fuse'), []);

    // Only trust data computed for the current selection and location.
    const ready = cardData !== null && cardData.key === cardKey(selected, location);

    // Auto-submit once per card, as soon as the reveal's ready card PDF exists.
    // Always prints: the "preview PDF" dev toggle does not hold the job back.
    const signature = cardKey(selected, location);
    const printedSignature = useRef<string | null>(null);
    useEffect(() => {
        if (!ready || !generatedCard) return;
        if (printedSignature.current === signature) return;
        printedSignature.current = signature;
        setPrintStatus('printing');
        printPdf(generatedCard.pdfUri)
            .then(() => setPrintStatus('done'))
            .catch(() => setPrintStatus('error'));
    }, [ready, generatedCard, signature, printPdf, setPrintStatus]);

    return (
        <SafeAreaView style={styles.screen}>
            {cardStatus === 'error' ? (
                <FailureState message={cardError} onRetry={refreshCardData} />
            ) : cardData && ready ? (
                <RevealStage cards={cardData.providers} onContinue={handleContinue} />
            ) : (
                <LoadingState />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        backgroundColor: Theme.background,
        flex: 1,
    },
});
