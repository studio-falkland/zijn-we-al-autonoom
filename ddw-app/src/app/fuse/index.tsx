// Fuse screen: the gathered service cards merge into the single personal A7 card.
// The card and its PDF are prepared in the background; the print button sends the
// PDF straight to the kiosk's selected printer, alongside the continue action.

import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FailureState } from '@/components/failure-state';
import { FuseStage } from '@/components/fuse/fuse-stage';
import { translate } from '@/i18n';
import { usePrinterStore } from '@/store/printer';
import { cardKey, useSessionStore } from '@/store/session';
import { Theme } from '@/theme/tokens';

export default function FuseScreen() {
    const selected = useSessionStore((state) => state.selectedServices);
    const location = useSessionStore((state) => state.location);
    const cardData = useSessionStore((state) => state.cardData);
    const cardStatus = useSessionStore((state) => state.cardStatus);
    const cardError = useSessionStore((state) => state.cardError);
    const generatedCard = useSessionStore((state) => state.generatedCard);
    const refreshCardData = useSessionStore((state) => state.refreshCardData);
    const printPdf = usePrinterStore((state) => state.printPdf);
    const [printing, setPrinting] = useState(false);
    const [printError, setPrintError] = useState<string | null>(null);

    // Send the PDF straight to the selected printer (no dialog).
    const handlePrint = useCallback(async () => {
        if (!generatedCard) return;
        setPrinting(true);
        setPrintError(null);
        try {
            await printPdf(generatedCard.pdfUri);
        } catch (failure) {
            setPrintError(failure instanceof Error ? failure.message : translate(useSessionStore.getState().language, 'print.printError'));
        } finally {
            setPrinting(false);
        }
    }, [generatedCard, printPdf]);

    // On to the outro, which closes the kiosk loop for the next visitor.
    const handleContinue = useCallback(() => router.push('/outro'), []);

    // Only trust data computed for the current selection and location.
    const ready = cardData !== null && cardData.key === cardKey(selected, location);

    return (
        <SafeAreaView style={styles.screen}>
            {cardStatus === 'error' ? (
                <FailureState message={cardError} onRetry={refreshCardData} />
            ) : cardData && ready ? (
                <FuseStage
                    cards={cardData.providers}
                    frequencies={cardData.frequencies}
                    place={cardData.place}
                    printing={printing}
                    printed={generatedCard !== null}
                    error={printError}
                    onPrint={handlePrint}
                    onContinue={handleContinue}
                />
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
