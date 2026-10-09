// Generate screen: a preview of the visitor's A7 card, rendered from the
// dependency breakdown of their selected services.

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Treemap } from '@/components/treemap/treemap';
import { A7_HEIGHT, A7_WIDTH } from '@/card/cardHtml';
import { getDependencyFrequencies, type MeasurementFrequency } from '@/data/dependencies';
import { getPlaceName } from '@/data/organisations';
import { useSessionStore } from '@/store/session';
import { Colors, Radii, Shadows, Spacing, Theme, Type } from '@/theme/tokens';

export default function GenerateScreen() {
    const location = useSessionStore((state) => state.location);
    const selected = useSessionStore((state) => state.selectedServices);
    const [frequencies, setFrequencies] = useState<MeasurementFrequency[] | null>(null);
    const [place, setPlace] = useState<string | null>(null);

    // Compute the dependency breakdown and the place name for the selection once.
    useEffect(() => {
        let cancelled = false;
        getDependencyFrequencies(selected).then((result) => {
            if (!cancelled) setFrequencies(result);
        });
        getPlaceName(location?.postcode ?? '').then((result) => {
            if (!cancelled) setPlace(result);
        });
        return () => {
            cancelled = true;
        };
    }, [selected, location]);

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
                    <View>
                        <Treemap
                            frequencies={frequencies}
                            width={A7_WIDTH}
                            height={A7_HEIGHT}
                            context={{ place }}
                        />
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
