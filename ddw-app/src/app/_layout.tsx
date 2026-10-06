// Root layout: renders the kiosk stack.
// Familjen Grotesk is embedded natively via the expo-font config plugin.
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
    return (
        <>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }} />
        </>
    );
}
