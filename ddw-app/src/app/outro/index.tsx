// Outro: the four-step guidance diagram, the closing copy, and the kiosk loop.
// The button counts down and the session resets, ready for the next visitor.

import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { FailureState } from '@/components/failure-state';
import { StepDiagram } from '@/components/outro/step-diagram';
import { cardKey, useSessionStore } from '@/store/session';
import { Spacing, Theme, Type } from '@/theme/tokens';

// Seconds before the kiosk resets itself for the next visitor.
const RESET_SECONDS = 60;

export default function OutroScreen() {
    const selected = useSessionStore((state) => state.selectedServices);
    const location = useSessionStore((state) => state.location);
    const cardData = useSessionStore((state) => state.cardData);
    const cardStatus = useSessionStore((state) => state.cardStatus);
    const cardError = useSessionStore((state) => state.cardError);
    const refreshCardData = useSessionStore((state) => state.refreshCardData);
    const resetSession = useSessionStore((state) => state.resetSession);
    const [seconds, setSeconds] = useState(RESET_SECONDS);
    const restarted = useRef(false);

    // Clear the session and return to the start, exactly once.
    const restart = useCallback(() => {
        if (restarted.current) return;
        restarted.current = true;
        resetSession();
        router.replace('/');
    }, [resetSession]);

    // Count down to the automatic reset.
    useEffect(() => {
        // const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
        // return () => clearInterval(timer);
    }, []);
    useEffect(() => {
        if (seconds === 0) restart();
    }, [seconds, restart]);

    // Only trust data computed for the current selection and location.
    const ready = cardData !== null && cardData.key === cardKey(selected, location);

    if (cardStatus === 'error') {
        return (
            <SafeAreaView style={styles.screen}>
                <FailureState message={cardError} onRetry={refreshCardData} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.content}>
                {cardData && ready && <StepDiagram frequencies={cardData.frequencies} place={cardData.place} />}
                <View style={styles.copy}>
                    <Text style={styles.line}>You can find any guidance on your guidance card.</Text>
                    <Text style={styles.line}>Let’s depict our society’s dependency together!</Text>
                    <Text style={styles.line}>Thank you for participating!</Text>
                </View>
                <Button label={`Return to start (${seconds}s)`} onPress={restart} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        backgroundColor: Theme.background,
        flex: 1,
    },
    content: {
        alignItems: 'center',
        flex: 1,
        gap: Spacing.xxl,
        justifyContent: 'space-evenly',
        paddingHorizontal: Spacing.xxxl,
        paddingVertical: Spacing.xxxl,
    },
    copy: {
        alignItems: 'center',
        gap: Spacing.md,
    },
    line: {
        ...Type.bodyLarge,
        textAlign: 'center',
    },
});
