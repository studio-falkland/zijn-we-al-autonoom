// Gather section, step 1: "Where do you live?"
//
// The map fills the left; the panel asks the question and confirms the postcode.
// Tapping the map resolves the tapped point to a postcode (via PDOK); the search
// box flies the camera to a municipality or postcode.
import { GeoJSONSource, Layer, type CameraRef, type MapProps } from '@maplibre/maplibre-react-native';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { CardBody, CardIcon, CardPatternedBackground } from '@/components/card/card-body';
import { CardContainer } from '@/components/card/card-container';
import { CardHeader, CardSubtitle, CardTitle } from '@/components/card/card-header';
import { BaseMap } from '@/components/gather/base-map';
import { MapPanel } from '@/components/gather/map-panel';
import { PostcodeSearch } from '@/components/gather/postcode-search';
import { PersonIcon } from '@/components/icons';
import { RESTART_BUTTON_GUTTER } from '@/components/restart-button';
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

    // Confirming the postcode advances to the locked-in providers (the next step).
    const handleConfirm = useCallback(() => {
        router.push('/services');
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
                        {/* Top overlay: the search beside the restart button, the card beneath. */}
                        <View style={styles.topOverlay}>
                            <View style={styles.searchWrap}>
                                <PostcodeSearch onSelect={handleSearchSelect} />
                            </View>
                            {(resolving || location) && (
                                <CardContainer style={styles.postcodeCard}>
                                    <Text style={styles.selectedLabel}>Currently selected postcode</Text>
                                    <Text style={styles.selectedValue}>
                                        {resolving ? '…' : location ? formatPostcode(location.postcode) : ''}
                                    </Text>
                                </CardContainer>
                            )}
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
    topOverlay: {
        gap: Spacing.md,
        left: 0,
        position: 'absolute',
        right: 0,
        top: Spacing.md,
    },
    searchWrap: {
        marginLeft: RESTART_BUTTON_GUTTER,
        marginRight: Spacing.lg,
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
    panel: {
        alignItems: 'flex-start',
        gap: Spacing.lg,
    },
    postcodeCard: {
        marginHorizontal: 'auto',
        flexShrink: 1,
        gap: Spacing.md,
        padding: Spacing.md,
    },
    selectedLabel: {
        ...Type.bodySmall,
        color: Theme.textMuted,
    },
    selectedValue: {
        ...Type.sub,
        textAlign: 'center',
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
