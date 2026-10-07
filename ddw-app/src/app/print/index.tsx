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
import { useSessionStore } from '@/store/session';
import { Spacing, Theme, Type } from '@/theme/tokens';

export default function PrintScreen() {
    const location = useSessionStore((s) => s.location);
    const selected = useSessionStore((s) => s.selectedServices);
    const generatedCard = useSessionStore((s) => s.generatedCard);
    const setGeneratedCard = useSessionStore((s) => s.setGeneratedCard);
    const setPrintStatus = useSessionStore((s) => s.setPrintStatus);
    const resetSession = useSessionStore((s) => s.resetSession);
    const [error, setError] = useState<string | null>(null);
    const [printing, setPrinting] = useState(false);

    // Generate the A7 PDF once when the visitor reaches this screen.
    useEffect(() => {
        if (generatedCard) return;
        let cancelled = false;

        (async () => {
            setPrintStatus('printing');
            try {
                const frequencies = await getDependencyFrequencies(selected);
                if (cancelled) return;
                if (frequencies.length === 0) {
                    setPrintStatus('error');
                    setError('Geen meetgegevens voor deze selectie.');
                    return;
                }
                const place = await getPlaceName(location?.zipcode ?? '');
                if (cancelled) return;
                const { uri } = await generateCardPdf(frequencies, { place });
                if (cancelled) return;
                setGeneratedCard({ pdfUri: uri });
                setPrintStatus('done');
            } catch (failure) {
                if (cancelled) return;
                setPrintStatus('error');
                setError(failure instanceof Error ? failure.message : 'Fout bij het maken van de kaart.');
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
            setError(failure instanceof Error ? failure.message : 'Printen is mislukt.');
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
                <Text style={Type.page}>Printen</Text>
                {error ? (
                    <Text style={Type.body}>{error}</Text>
                ) : !generatedCard ? (
                    <Text style={Type.body}>Kaart maken…</Text>
                ) : (
                    <>
                        <Text style={Type.body}>De kaart staat klaar.</Text>
                        <Button label="Testprint (AirPrint)" onPress={handlePrint} disabled={printing} />
                    </>
                )}
                <Button label="Klaar" onPress={handleDone} />
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
