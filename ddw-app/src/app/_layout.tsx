// Root layout: renders the kiosk stack.
// Familjen Grotesk is embedded natively via the expo-font config plugin.
import { Colors } from '@/theme/tokens';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RestartButton } from '@/components/restart-button';

export default function RootLayout() {
    const pathname = usePathname();

    return (
        <View style={styles.container}>
            <StatusBar hidden />
            <Stack screenOptions={{ headerShown: false }} />
            {/* A global restart control, corner-anchored and out of the start screen's way. */}
            {pathname !== '/' && (
                <SafeAreaView style={[StyleSheet.absoluteFill, styles.overlay]}>
                    <RestartButton />
                </SafeAreaView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.blue[200],
        flex: 1,
    },
    // The overlay lets touches through everywhere except its own controls.
    overlay: {
        pointerEvents: 'box-none',
    },
});
