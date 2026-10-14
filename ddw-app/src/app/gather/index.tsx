// Gather section, step 1: "Where do you live?"
//
// The map fills the whole screen; the right third floats over it, holding the
// search, the visitor's card and the actions. Tapping the map resolves the
// tapped point to a postcode (via PDOK); the search box flies the camera to a
// municipality or postcode.
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
import { PostcodeSearch } from '@/components/gather/postcode-search';
import { PersonIcon } from '@/components/icons';
import { reversePlace, type PlaceSuggestion } from '@/data/places';
import { useTranslation } from '@/i18n/use-translation';
import { useSessionStore } from '@/store/session';
import { Colors, Radii, Shadows, Spacing, Theme, Type } from '@/theme/tokens';

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
    const { t } = useTranslation();
    const cameraRef = useRef<CameraRef>(null);
    // The just-tapped point, drawn at once (in map coordinates) while it resolves.
    const [pendingLngLat, setPendingLngLat] = useState<[number, number] | null>(null);

    // Tapping the map marks the point at once, then resolves its postcode.
    const handleMapPress = useCallback<NonNullable<MapProps['onPress']>>(
        (event) => {
            const [lng, lat] = event.nativeEvent.lngLat;
            const point: [number, number] = [lng, lat];
            setPendingLngLat(point);
            // Clear the optimistic point in the SAME update that stores it, so
            // the two never render together (no double-dot flash).
            reversePlace(lng, lat)
                .then((place) => {
                    if (place?.postcode) setLocation({ postcode: place.postcode, center: point, pdok: place });
                    setPendingLngLat(null);
                })
                .catch(() => setPendingLngLat(null));
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

    // The card shows the city from the PDOK document, falling back to the postcode.
    const place = location?.pdok?.woonplaatsnaam ?? location?.pdok?.gemeentenaam ?? null;

    return (
        <SafeAreaView style={styles.screen}>
            {/* The map fills the whole screen; the column floats over it. */}
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
            {/* The right third: the search, the visitor's card, and the actions. */}
            <View style={styles.column}>
                <PostcodeSearch onSelect={handleSearchSelect} />
                <View style={styles.panel}>
                    <Text style={styles.body}>{t('gather.lead1')}</Text>
                    <Text style={styles.body}>{t('gather.lead2')}</Text>
                    <Button
                        label={
                            location
                                ? t('gather.explorePostcode', { postcode: formatPostcode(location.postcode) })
                                : t('gather.explore')
                        }
                        disabled={!location}
                        onPress={handleConfirm}
                        size="small"
                    />
                </View>
                {/* The "You" card: the question (or the answer), over a hatched
                    panel with the visitor's icon. */}
                <CardContainer style={styles.cardBody}>
                    <CardHeader>
                        <CardTitle>{t('gather.you')}</CardTitle>
                        <CardSubtitle>
                            {location
                                ? t('gather.liveIn', { place: place ?? formatPostcode(location.postcode) })
                                : t('gather.whereDoYouLive')}
                        </CardSubtitle>
                    </CardHeader>
                    <CardBody>
                        <CardPatternedBackground />
                        <CardIcon>
                            <PersonIcon width={90} height={150} />
                        </CardIcon>
                    </CardBody>
                </CardContainer>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        backgroundColor: Theme.background,
        flex: 1,
    },
    // The right third: the search, the visitor's card, and the actions.
    column: {
        gap: Spacing.md,
        position: 'absolute',
        right: Spacing.lg,
        top: Spacing.lg,
        width: '33%',
    },
    cardBody: {
        alignSelf: 'flex-end',
        minHeight: 280,
        width: 190,
    },
    // The floating panel: same stroke and shadow as the search field.
    panel: {
        backgroundColor: Colors.white,
        borderColor: Colors.blue[800],
        borderRadius: Radii.md,
        borderWidth: 1,
        gap: Spacing.md,
        padding: Spacing.lg,
        ...Shadows.boxSmall,
    },
    body: {
        ...Type.bodyLarge,
        fontSize: 20,
        lineHeight: 24,
    },
});
