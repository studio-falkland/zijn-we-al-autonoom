// Generate screen: the reveal. The services the visitor gathered are dealt in as
// cards, animated into a grid, turned over one by one onto each service's own
// email and web hosting providers, and the US providers are recoloured red.

import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RevealStage } from '@/components/reveal/reveal-stage';
import { getServiceProviders, type ServiceProviders } from '@/data/dependencies';
import { useSessionStore } from '@/store/session';
import { Spacing, Theme, Type } from '@/theme/tokens';

export default function GenerateScreen() {
    const selected = useSessionStore((state) => state.selectedServices);
    const [cards, setCards] = useState<ServiceProviders[] | null>(null);

    // Resolve each service's own providers once, for the per-card mosaics.
    useEffect(() => {
        let cancelled = false;
        getServiceProviders(selected).then((result) => {
            if (!cancelled) setCards(result);
        });
        return () => {
            cancelled = true;
        };
    }, [selected]);

    // The reveal closes on this: on to the print step.
    const handleContinue = useCallback(() => router.push('/print'), []);

    return (
        <SafeAreaView style={styles.screen}>
            {cards === null ? (
                <Text style={styles.waiting}>Diensten analyseren…</Text>
            ) : (
                <RevealStage cards={cards} onContinue={handleContinue} />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        backgroundColor: Theme.background,
        flex: 1,
    },
    waiting: {
        ...Type.body,
        paddingHorizontal: Spacing.xxxl,
        paddingTop: Spacing.xxxl,
    },
});
