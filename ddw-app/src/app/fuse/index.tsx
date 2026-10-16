// Fuse screen: the gathered service cards merge into the single personal A7 card.
// The card's PDF is printed automatically on the reveal screen; the button here
// reprints it, alongside the continue action.

import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Share, StyleSheet } from 'react-native';
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
    const printStatus = useSessionStore((state) => state.printStatus);
    const setPrintStatus = useSessionStore((state) => state.setPrintStatus);
    const previewPdf = useSessionStore((state) => state.previewPdf);
    const refreshCardData = useSessionStore((state) => state.refreshCardData);
    const printPdf = usePrinterStore((state) => state.printPdf);
    const [printError, setPrintError] = useState<string | null>(null);

    // Only trust data computed for the current selection and location.
    const ready = cardData !== null && cardData.key === cardKey(selected, location);

    // The failure to show: this screen's own attempt, or the reveal's auto-print.
    const failure =
        printError ??
        (printStatus === 'error' ? translate(useSessionStore.getState().language, 'print.printError') : null);

    // Send the card's PDF straight to the printer (no dialog), for a reprint.
    const printCard = useCallback(async () => {
        if (!generatedCard) return;
        setPrintError(null);
        setPrintStatus('printing');
        try {
            await printPdf(generatedCard.pdfUri);
            setPrintStatus('done');
        } catch (failure) {
            setPrintStatus('error');
            setPrintError(
                failure instanceof Error
                    ? failure.message
                    : translate(useSessionStore.getState().language, 'print.printError'),
            );
        }
    }, [generatedCard, printPdf, setPrintStatus]);

    // The manual button: preview the PDF (dev toggle) or print it again.
    const handlePrint = useCallback(async () => {
        if (!generatedCard) return;
        if (!previewPdf) return printCard();
        try {
            await Share.share({ url: generatedCard.pdfUri });
        } catch (failure) {
            setPrintError(
                failure instanceof Error
                    ? failure.message
                    : translate(useSessionStore.getState().language, 'print.printError'),
            );
        }
    }, [generatedCard, previewPdf, printCard]);

    // On to the outro, which closes the kiosk loop for the next visitor.
    const handleContinue = useCallback(() => router.push('/outro'), []);

    return (
        <SafeAreaView style={styles.screen}>
            {cardStatus === 'error' ? (
                <FailureState message={cardError} onRetry={refreshCardData} />
            ) : cardData && ready ? (
                <FuseStage
                    cards={cardData.providers}
                    frequencies={cardData.frequencies}
                    place={cardData.place}
                    printing={printStatus === 'printing'}
                    printed={printStatus === 'done'}
                    preview={previewPdf}
                    error={failure}
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
