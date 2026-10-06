// Print screen: shows the print status; the explicit Done action resets the session.
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { useSessionStore } from '@/store/session';
import { Spacing, Theme, Type } from '@/theme/tokens';

export default function PrintScreen() {
    const printStatus = useSessionStore((s) => s.printStatus);
    const resetSession = useSessionStore((s) => s.resetSession);

    // Reset the session and return to the start for the next visitor.
    const handleDone = () => {
        resetSession();
        router.replace('/');
    };

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.content}>
                <Text style={Type.page}>Printen</Text>
                <Text style={Type.body}>Status: {printStatus}</Text>
                <Text style={Type.bodySmall}>
                    De printerintegratie volgt in fase 3; tot die tijd is dit het einde van het pad.
                </Text>
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
