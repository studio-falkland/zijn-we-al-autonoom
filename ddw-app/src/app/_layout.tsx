// Root layout: renders the kiosk stack.
// Familjen Grotesk is embedded natively via the expo-font config plugin.
import { Colors } from '@/theme/tokens';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

export default function RootLayout() {
    return (
        <View style={styles.container}>
            <StatusBar hidden />
            <Stack screenOptions={{ headerShown: false }} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.blue[200],
        flex: 1,
    }
})
