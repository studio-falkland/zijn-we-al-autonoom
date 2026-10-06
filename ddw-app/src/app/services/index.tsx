// Services screen: local organisations in the visitor's postcode area.
import type { Organisation } from '@are-we-dependent/data';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { getServicesByZipcode } from '@/data/services';
import { useSessionStore } from '@/store/session';
import { Colors, Spacing, Theme, Type } from '@/theme/tokens';

export default function ServicesScreen() {
    const location = useSessionStore((s) => s.location);
    const selected = useSessionStore((s) => s.selectedServices);
    const toggleService = useSessionStore((s) => s.toggleService);
    const [services, setServices] = useState<Organisation[]>([]);
    const [loading, setLoading] = useState(true);

    // Load the services for the visitor's postcode area once.
    useEffect(() => {
        if (!location) return;
        getServicesByZipcode(location.zipcode)
            .then(setServices)
            .finally(() => setLoading(false));
    }, [location]);

    // A service is selected when its slug is in the session.
    const isSelected = (slug: string) => selected.some((s) => s.slug === slug);

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.header}>
                <Text style={Type.page}>Diensten</Text>
                <Text style={styles.hint}>{location ? `Postcode ${location.zipcode}` : ''}</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <Text style={Type.body}>Diensten laden…</Text>
                </View>
            ) : (
                <FlatList
                    data={services}
                    keyExtractor={(service) => service.slug}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <Pressable
                            onPress={() => toggleService(item)}
                            style={[styles.row, isSelected(item.slug) && styles.rowSelected]}
                        >
                            <Text style={Type.body}>{item.name}</Text>
                            <Text style={styles.rowMeta}>{item.classifications[0]?.category ?? ''}</Text>
                        </Pressable>
                    )}
                />
            )}

            <View style={styles.footer}>
                <Button
                    label={`Kaart genereren (${selected.length})`}
                    disabled={selected.length === 0}
                    onPress={() => router.push('/generate')}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: Theme.background,
    },
    header: {
        padding: Spacing.lg,
        gap: Spacing.xs,
    },
    hint: {
        ...Type.bodySmall,
        color: Theme.textMuted,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    list: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
    },
    row: {
        backgroundColor: Theme.panel,
        padding: Spacing.md,
        gap: Spacing.xs,
    },
    rowSelected: {
        backgroundColor: Colors.blue[200],
    },
    rowMeta: {
        ...Type.bodySmall,
        color: Theme.textMuted,
    },
    footer: {
        padding: Spacing.lg,
    },
});
