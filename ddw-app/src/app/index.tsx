// Start screen: the kiosk title and entry into the flow.
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Theme, Type } from '@/theme/tokens';

export default function StartScreen() {
    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.content}>
                <Text style={Type.hero}>Zijn we al autonoom?</Text>
                <Text style={styles.subtitle}>
                    Ontdek welke diensten in jouw buurt afhankelijk zijn van grote techbedrijven.
                </Text>
                <Button label="Begin" onPress={() => router.push('/location')} />
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
        gap: 32,
        paddingHorizontal: 64,
    },
    subtitle: {
        ...Type.bodyLarge,
        color: Theme.textMuted,
        textAlign: 'center',
        maxWidth: 640,
    },
});
