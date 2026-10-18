// Print screen: generates the A7 PDF once, then sends it straight to the kiosk's
// selected printer (no dialog). The printer is chosen at app start; the picker
// and the direct submission live in src/store/printer.ts.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { generateCardPdf } from '@/card/generate';
import { getDependencyFrequencies } from '@/data/dependencies';
import { translate } from '@/i18n';
import { useTranslation } from '@/i18n/use-translation';
import { usePrinterStore } from '@/store/printer';
import { useSessionStore } from '@/store/session';
import { Spacing, Theme, Type } from '@/theme/tokens';

export default function PrintScreen() {
    const location = useSessionStore((s) => s.location);
    const selected = useSessionStore((s) => s.selectedServices);
    const generatedCard = useSessionStore((s) => s.generatedCard);
    const previewPdf = useSessionStore((s) => s.previewPdf);
    const setGeneratedCard = useSessionStore((s) => s.setGeneratedCard);
    const setPrintStatus = useSessionStore((s) => s.setPrintStatus);
    const resetSession = useSessionStore((s) => s.resetSession);
    const printPdf = usePrinterStore((s) => s.printPdf);
    const { t } = useTranslation();
    const [error, setError] = useState<string | null>(null);
    const [printing, setPrinting] = useState(false);

    // Generate the A7 PDF once when the visitor reaches this screen.
    useEffect(() => {
        if (generatedCard) return;
        let cancelled = false;

        (async () => {
            // Read the language imperatively: the effect must not re-run on a
            // language switch (it would regenerate the PDF).
            const language = useSessionStore.getState().language;
            try {
                const unknown = translate(language, 'card.unknown');
                const frequencies = await getDependencyFrequencies(selected, unknown);
                if (cancelled) return;
                if (frequencies.length === 0) {
                    setError(translate(language, 'common.noMeasurements'));
                    return;
                }
                const place = location?.pdok?.woonplaatsnaam ?? location?.pdok?.gemeentenaam ?? null;
                const { uri } = await generateCardPdf(frequencies, { place, center: location?.center ?? null, language });
                if (cancelled) return;
                setGeneratedCard({ pdfUri: uri });
            } catch (failure) {
                if (cancelled) return;
                setError(failure instanceof Error ? failure.message : translate(language, 'print.generateError'));
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [generatedCard, selected, location, setGeneratedCard]);

    // Send the PDF straight to the selected printer (no dialog).
    const handlePrint = async () => {
        if (!generatedCard) return;
        setPrinting(true);
        setPrintStatus('printing');
        try {
            await printPdf(generatedCard.pdfUri);
            setPrintStatus('done');
        } catch (failure) {
            setPrintStatus('error');
            setError(
                failure instanceof Error
                    ? failure.message
                    : translate(useSessionStore.getState().language, 'print.printError'),
            );
        } finally {
            setPrinting(false);
        }
    };

    // Dev path (the "preview PDF" setting): open the generated PDF in the OS
    // preview instead of the print dialog, so the card can be checked on device.
    const handlePreview = async () => {
        if (!generatedCard) return;
        try {
            await Share.share({ url: generatedCard.pdfUri });
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : translate(useSessionStore.getState().language, 'print.printError'),
            );
        }
    };

    // Reset the session and return to the start for the next visitor.
    const handleDone = () => {
        resetSession();
        router.dismissAll();
    };

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.content}>
                <Text style={Type.page}>{t('print.title')}</Text>
                {error ? (
                    <Text style={Type.body}>{error}</Text>
                ) : !generatedCard ? (
                    <Text style={Type.body}>{t('print.making')}</Text>
                ) : (
                    <>
                        <Text style={Type.body}>{t('print.ready')}</Text>
                        {previewPdf ? (
                            <Button label={t('print.preview')} onPress={handlePreview} />
                        ) : (
                            <Button label={t('print.testPrint')} onPress={handlePrint} disabled={printing} />
                        )}
                    </>
                )}
                <Button label={t('print.done')} onPress={handleDone} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: Theme.background,
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        gap: Spacing.lg,
        paddingHorizontal: Spacing.xxxl,
    },
});
