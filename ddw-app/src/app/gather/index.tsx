// Gather section, step 1: "Where do you live?"
//
// The map fills the left; the panel asks the question and confirms the postcode.
// Tapping the map resolves the tapped point to a postcode (via PDOK); the search
// box flies the camera to a municipality or postcode.
import { Marker, type CameraRef, type MapProps } from '@maplibre/maplibre-react-native';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { BaseMap, NL_BOUNDS } from '@/components/gather/base-map';
import { MapPanel } from '@/components/gather/map-panel';
import { PostcodeSearch } from '@/components/gather/postcode-search';
import { reversePostcode, type PlaceSuggestion } from '@/data/places';
import { useSessionStore } from '@/store/session';
import { Colors, Radii, Spacing, Theme, Type } from '@/theme/tokens';

// PDOK returns postcodes without a space ("1011AB"); add one for display only.
const formatPostcode = (postcode: string) => postcode.replace(/^(\d{4})([A-Z]{2})$/i, '$1 $2');

export default function PostcodeScreen() {
    const location = useSessionStore((state) => state.location);
    const setLocation = useSessionStore((state) => state.setLocation);
    const cameraRef = useRef<CameraRef>(null);
    const [resolving, setResolving] = useState(false);
    // The just-tapped point, shown immediately while its postcode resolves.
    const [pending, setPending] = useState<[number, number] | null>(null);

    // Tapping the map marks the point at once, then resolves its postcode.
    const handleMapPress = useCallback<NonNullable<MapProps['onPress']>>(
        (event) => {
            const [lng, lat] = event.nativeEvent.lngLat;
            const point: [number, number] = [lng, lat];
            setPending(point);
            setResolving(true);
            reversePostcode(lng, lat)
                .then((postcode) => {
                    if (postcode) setLocation({ postcode, center: point });
                })
                .finally(() => {
                    setResolving(false);
                    setPending(null);
                });
        },
        [setLocation],
    );

    // Choosing a search suggestion flies the camera to its centroid.
    const handleSearchSelect = useCallback((place: PlaceSuggestion) => {
        if (place.center) cameraRef.current?.flyTo({ center: place.center, zoom: 13, duration: 500 });
    }, []);

    // The reset control returns the camera to the whole country.
    const handleReset = useCallback(() => {
        cameraRef.current?.fitBounds(NL_BOUNDS, { duration: 400 });
    }, []);

    // Confirming the postcode advances to service gathering (the next step).
    const handleConfirm = useCallback(() => {
        // TODO: advance to the services step once it exists.
    }, []);

    // The marker sits on the pending tap first, then on the stored location.
    const markerPoint = pending ?? location?.center ?? null;

    return (
        <SafeAreaView style={styles.screen}>
            <MapPanel
                map={
                    <View style={styles.mapWrap}>
                        <BaseMap cameraRef={cameraRef} onPress={handleMapPress}>
                            {/* The chosen point, marked on the map. */}
                            {markerPoint && (
                                <Marker lngLat={markerPoint} anchor="center">
                                    <View style={styles.marker} />
                                </Marker>
                            )}
                        </BaseMap>
                        {/* Top bar: reset the view, and the selected postcode card. */}
                        <View style={styles.topBar}>
                            <Pressable
                                onPress={handleReset}
                                hitSlop={8}
                                style={({ pressed }) => [styles.reset, pressed && styles.pressed]}
                            >
                                <Text style={styles.resetLabel}>↺</Text>
                            </Pressable>
                            {(resolving || location) && (
                                <Card style={styles.postcodeCard}>
                                    <Text style={styles.selectedLabel}>Currently selected postcode</Text>
                                    <Text style={styles.selectedValue}>
                                        {resolving ? '…' : location ? formatPostcode(location.postcode) : ''}
                                    </Text>
                                </Card>
                            )}
                        </View>
                        {/* Search pinned to the bottom edge of the map. */}
                        <View style={styles.search}>
                            <PostcodeSearch onSelect={handleSearchSelect} />
                        </View>
                    </View>
                }
                panel={
                    <View style={styles.panel}>
                        {/* The "You" card: the question, replaced by the answer. */}
                        <Card style={styles.cardBody}>
                            <Text style={styles.cardTitle}>You</Text>
                            <Text style={styles.cardSub}>
                                {location ? `Live in ${formatPostcode(location.postcode)}` : 'Where do you live?'}
                            </Text>
                        </Card>
                        <Text style={styles.body}>Let&apos;s start from our surroundings.</Text>
                        <Text style={styles.body}>Zoom to where you live or stay, then tap the map.</Text>
                        <Button
                            label={location ? `Explore ${formatPostcode(location.postcode)}` : 'Explore'}
                            disabled={!location}
                            onPress={handleConfirm}
                        />
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        backgroundColor: Theme.background,
        flex: 1,
    },
    mapWrap: {
        flex: 1,
        position: 'relative',
    },
    marker: {
        backgroundColor: Colors.blue[900],
        borderColor: Colors.white,
        borderRadius: Radii.pill,
        borderWidth: 2,
        height: 14,
        width: 14,
    },
    topBar: {
        alignItems: 'flex-start',
        flexDirection: 'row',
        gap: Spacing.md,
        left: Spacing.lg,
        position: 'absolute',
        right: Spacing.lg,
        top: Spacing.lg,
    },
    reset: {
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderColor: Colors.blue[800],
        borderRadius: Radii.md,
        borderWidth: 1,
        height: 44,
        justifyContent: 'center',
        width: 44,
    },
    pressed: {
        backgroundColor: Colors.blue[50],
    },
    resetLabel: {
        ...Type.sub,
        color: Colors.blue[800],
        lineHeight: 28,
    },
    search: {
        bottom: Spacing.lg,
        left: Spacing.lg,
        position: 'absolute',
        right: Spacing.lg,
    },
    panel: {
        alignItems: 'flex-start',
        gap: Spacing.lg,
    },
    postcodeCard: {
        marginHorizontal: 'auto',
        flexShrink: 1,
        gap: Spacing.xs,
    },
    selectedLabel: {
        ...Type.bodySmall,
        color: Theme.textMuted,
    },
    selectedValue: {
        ...Type.sub,
    },
    cardBody: {
        alignSelf: 'stretch',
        gap: Spacing.xs,
    },
    cardTitle: {
        ...Type.sub,
    },
    cardSub: {
        ...Type.body,
        color: Theme.textMuted,
    },
    body: {
        ...Type.bodyLarge,
    },
});
