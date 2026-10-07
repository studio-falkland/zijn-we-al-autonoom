// Generate screen: a preview of the visitor's A7 card, rendered from the
// dependency breakdown of their selected services.

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Treemap } from '@/components/treemap/treemap';
import { getDependencyFrequencies, type MeasurementFrequency } from '@/data/dependencies';
import { useSessionStore } from '@/store/session';
import { Colors, Radii, Shadows, Spacing, Theme, Type } from '@/theme/tokens';

// The card preview matches the printable A7 geometry (74x105mm at 72 PPI).
const CARD_WIDTH = 210;
const CARD_HEIGHT = 298;

export default function GenerateScreen() {
    const selected = useSessionStore((state) => state.selectedServices);
    const [frequencies, setFrequencies] = useState<MeasurementFrequency[] | null>(null);

    // Compute the dependency breakdown for the selection once.
    useEffect(() => {
        let cancelled = false;
        getDependencyFrequencies(selected).then((result) => {
            if (!cancelled) setFrequencies(result);
        });
        return () => {
            cancelled = true;
        };
    }, [selected]);

    const empty = frequencies !== null && frequencies.length === 0;

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.content}>
                <Text style={Type.page}>Jouw kaart</Text>
                {frequencies === null ? (
                    <Text style={Type.body}>Diensten analyseren…</Text>
                ) : empty ? (
                    <Text style={Type.body}>Geen meetgegevens voor deze selectie.</Text>
                ) : (
                    <View style={styles.card}>
                        <Treemap frequencies={frequencies} width={CARD_WIDTH} height={CARD_HEIGHT} />
                    </View>
                )}
                <Button label="Naar printen" onPress={() => router.push('/print')} />
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
    card: {
        backgroundColor: Colors.white,
        borderRadius: Radii.sm,
        ...Shadows.drop,
    },
});
