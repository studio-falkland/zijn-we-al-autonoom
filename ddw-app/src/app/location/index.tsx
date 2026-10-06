// Location screen: the visitor enters their zipcode.
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { useSessionStore } from '@/store/session';
import { Theme, Type } from '@/theme/tokens';

export default function LocationScreen() {
    const [zipcode, setZipcode] = useState('');
    const setLocation = useSessionStore((s) => s.setLocation);
    const isValid = zipcode.replace(/\D/g, '').length >= 4;

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.content}>
                <Text style={Type.page}>Waar woon je?</Text>
                <TextInput
                    value={zipcode}
                    onChangeText={setZipcode}
                    placeholder="1234 AB"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    style={styles.input}
                />
                <Button
                    label="Volgende"
                    disabled={!isValid}
                    onPress={() => {
                        setLocation({ zipcode });
                        router.push('/services');
                    }}
                />
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
    input: {
        ...Type.bodyLarge,
        color: Theme.text,
        borderBottomWidth: 2,
        borderBottomColor: Theme.text,
        minWidth: 240,
        textAlign: 'center',
    },
});
