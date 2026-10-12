// Print screen: generates the A7 PDF once, then offers the interim AirPrint
// test print (confirm-tap). Automatic IPP delivery to the Epson is Phase 3;
// until then the print dialog is the development fallback.
import { router } from 'expo-router';
import * as Print from 'expo-print';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { generateCardPdf } from '@/card/generate';
import { getDependencyFrequencies } from '@/data/dependencies';
import { getPlaceName } from '@/data/organisations';
import { translate } from '@/i18n';
import { useTranslation } from '@/i18n/use-translation';
import { useSessionStore } from '@/store/session';
import { Spacing, Theme, Type } from '@/theme/tokens';

export default function PrintScreen() {
    const location = useSessionStore((s) => s.location);
    const selected = useSessionStore((s) => s.selectedServices);
    const generatedCard = useSessionStore((s) => s.generatedCard);
    const setGeneratedCard = useSessionStore((s) => s.setGeneratedCard);
    const setPrintStatus = useSessionStore((s) => s.setPrintStatus);
    const resetSession = useSessionStore((s) => s.resetSession);
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
            setPrintStatus('printing');
            try {
                const unknown = translate(language, 'card.unknown');
                const frequencies = await getDependencyFrequencies(selected, unknown);
                if (cancelled) return;
                if (frequencies.length === 0) {
                    setPrintStatus('error');
                    setError(translate(language, 'common.noMeasurements'));
                    return;
                }
                const place = await getPlaceName(location?.postcode ?? '');
                if (cancelled) return;
                const { uri } = await generateCardPdf(frequencies, { place, language });
                if (cancelled) return;
                setGeneratedCard({ pdfUri: uri });
                setPrintStatus('done');
            } catch (failure) {
                if (cancelled) return;
                setPrintStatus('error');
                setError(failure instanceof Error ? failure.message : translate(language, 'print.generateError'));
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [generatedCard, selected, location, setGeneratedCard, setPrintStatus]);

    // Interim path: send the PDF to AirPrint with a confirm-tap dialog.
    const handlePrint = async () => {
        if (!generatedCard) return;
        setPrinting(true);
        try {
            await Print.printAsync({ uri: generatedCard.pdfUri });
        } catch (failure) {
            setError(
                failure instanceof Error
                    ? failure.message
                    : translate(useSessionStore.getState().language, 'print.printError'),
            );
        } finally {
            setPrinting(false);
        }
    };

    // Reset the session and return to the start for the next visitor.
    const handleDone = () => {
        resetSession();
        router.replace('/');
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
                        <Button label={t('print.testPrint')} onPress={handlePrint} disabled={printing} />
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
