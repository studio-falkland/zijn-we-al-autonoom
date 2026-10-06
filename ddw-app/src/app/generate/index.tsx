// Generate screen: placeholder until the treemap renderer lands in Phase 1.
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { useSessionStore } from '@/store/session';
import { Spacing, Theme, Type } from '@/theme/tokens';

export default function GenerateScreen() {
    const selected = useSessionStore((s) => s.selectedServices);

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.content}>
                <Text style={Type.page}>Jouw kaart</Text>
                <Text style={Type.body}>
                    {selected.length} diensten geselecteerd. De kaartgenerator volgt in fase 1.
                </Text>
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
});
