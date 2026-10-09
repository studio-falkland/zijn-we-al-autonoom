// Gather section, step 1: "Where do you live?"
//
// The map fills the left; the panel asks the question and confirms the postcode.
// Tapping the map resolves the tapped point to a postcode (via PDOK); the search
// box flies the camera to a municipality or postcode.
import { GeoJSONSource, Layer, type CameraRef, type MapProps } from '@maplibre/maplibre-react-native';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { CardBody, CardIcon, CardPatternedBackground } from '@/components/card/card-body';
import { CardContainer } from '@/components/card/card-container';
import { CardHeader, CardSubtitle, CardTitle } from '@/components/card/card-header';
import { BaseMap, NL_BOUNDS } from '@/components/gather/base-map';
import { MapPanel } from '@/components/gather/map-panel';
import { PostcodeSearch } from '@/components/gather/postcode-search';
import { PersonIcon } from '@/components/icons';
import { reversePlace, type PlaceSuggestion } from '@/data/places';
import { useSessionStore } from '@/store/session';
import { Colors, Radii, Spacing, Theme, Type } from '@/theme/tokens';

// PDOK returns postcodes without a space ("1011AB"); add one for display only.
const formatPostcode = (postcode: string) => postcode.replace(/^(\d{4})([A-Z]{2})$/i, '$1 $2');

// A one-point FeatureCollection for the map's dot layer (empty when no point).
function pointFeature(point: [number, number] | null): GeoJSON.FeatureCollection {
    return {
        type: 'FeatureCollection',
        features: point ? [{ type: 'Feature', geometry: { type: 'Point', coordinates: point }, properties: {} }] : [],
    };
}

export default function PostcodeScreen() {
    const location = useSessionStore((state) => state.location);
    const setLocation = useSessionStore((state) => state.setLocation);
    const cameraRef = useRef<CameraRef>(null);
    const [resolving, setResolving] = useState(false);
    // The just-tapped point, drawn at once (in map coordinates) while it resolves.
    const [pendingLngLat, setPendingLngLat] = useState<[number, number] | null>(null);

    // Tapping the map marks the point at once, then resolves its postcode.
    const handleMapPress = useCallback<NonNullable<MapProps['onPress']>>(
        (event) => {
            const [lng, lat] = event.nativeEvent.lngLat;
            const point: [number, number] = [lng, lat];
            setPendingLngLat(point);
            setResolving(true);
            // Clear the optimistic point in the SAME update that stores it, so
            // the two never render together (no double-dot flash).
            const settle = () => {
                setResolving(false);
                setPendingLngLat(null);
            };
            reversePlace(lng, lat)
                .then((place) => {
                    if (place?.postcode) setLocation({ postcode: place.postcode, center: point, pdok: place });
                    settle();
                })
                .catch(settle);
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

    // The dot sits on the pending tap first, then on the stored location.
    const markerPoint = pendingLngLat ?? location?.center ?? null;

    return (
        <SafeAreaView style={styles.screen}>
            <MapPanel
                map={
                    <View style={styles.mapWrap}>
                        <BaseMap cameraRef={cameraRef} onPress={handleMapPress}>
                            {/* The chosen point, drawn as an anchored dot layer. */}
                            <GeoJSONSource id="selected-point" data={pointFeature(markerPoint)}>
                                <Layer
                                    id="selected-point-dot"
                                    type="circle"
                                    paint={{
                                        'circle-color': Colors.blue[900],
                                        'circle-radius': 7,
                                        'circle-stroke-color': Colors.white,
                                        'circle-stroke-width': 2,
                                    }}
                                />
                            </GeoJSONSource>
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
                                <CardContainer style={styles.postcodeCard}>
                                    <Text style={styles.selectedLabel}>Currently selected postcode</Text>
                                    <Text style={styles.selectedValue}>
                                        {resolving ? '…' : location ? formatPostcode(location.postcode) : ''}
                                    </Text>
                                </CardContainer>
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
                        {/* The "You" card: the question (or the answer), over a
                            hatched panel with the visitor's icon. */}
                        <CardContainer style={styles.cardBody}>
                            <CardHeader>
                                <CardTitle>You</CardTitle>
                                <CardSubtitle>
                                    {location ? `Live in ${formatPostcode(location.postcode)}` : 'Where do you live?'}
                                </CardSubtitle>
                            </CardHeader>
                            <CardBody>
                                <CardPatternedBackground />
                                <CardIcon>
                                    <PersonIcon width={90} height={150} />
                                </CardIcon>
                            </CardBody>
                        </CardContainer>
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
        padding: Spacing.md,
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
        minHeight: 280,
        width: 190,
        marginHorizontal: 'auto',
        marginBottom: Spacing.xxl,
    },
    body: {
        ...Type.bodyLarge,
    },
});
