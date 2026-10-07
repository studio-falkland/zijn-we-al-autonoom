// Map screen: visitors zoom into the printed-map-style view of the
// Netherlands and tap an organisation to pick their neighbourhood.

import type { Organisation } from '@are-we-dependent/data';
import type { CameraRef, GeoJSONSourceRef } from '@maplibre/maplibre-react-native';
import { Camera, GeoJSONSource, Images, Layer, Map } from '@maplibre/maplibre-react-native';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMapOrganisations } from '@/data/organisations';
import { mapStyle } from '@/map/style';
import { useSessionStore } from '@/store/session';
import { Spacing, Theme, Type } from '@/theme/tokens';

// The Netherlands with margin; the camera never leaves the country.
const NL_BOUNDS: [number, number, number, number] = [3.2, 50.7, 7.3, 53.6];
const NL_MAX_BOUNDS: [number, number, number, number] = [2.5, 50.2, 8.0, 54.1];

// Organisations become GeoJSON points carrying their postcode area.
function toFeatures(organisations: Organisation[]): GeoJSON.FeatureCollection {
    return {
        type: 'FeatureCollection',
        features: organisations
            .filter((org) => org.lat != null && org.lng != null)
            .map((org) => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [org.lng as number, org.lat as number] },
                properties: { slug: org.slug, name: org.name, postcode: org.postcode ?? '' },
            })),
    };
}

export default function MapScreen() {
    const setLocation = useSessionStore((state) => state.setLocation);
    const [organisations, setOrganisations] = useState<Organisation[] | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const cameraRef = useRef<CameraRef>(null);
    const sourceRef = useRef<GeoJSONSourceRef>(null);

    // Load the map organisations once on mount.
    useEffect(() => {
        getMapOrganisations()
            .then(setOrganisations)
            .catch((error) => {
                console.error('Failed to load map organisations', error);
                setLoadError(error instanceof Error ? error.message : 'De kaart kon niet worden geladen.');
            });
    }, []);

    const features = useMemo(
        () => (organisations ? toFeatures(organisations) : null),
        [organisations],
    );

    // Tapping an organisation selects its postcode area and moves on.
    const handlePress = useCallback(
        async (event: { nativeEvent: { features: GeoJSON.Feature[] } }) => {
            const feature = event.nativeEvent.features?.[0];
            if (!feature) return;

            // A cluster: zoom into the orgs it contains.
            const properties = feature.properties as Record<string, unknown> | null;
            if (properties?.point_count) {
                const clusterId = properties.cluster_id as number;
                const zoom = await sourceRef.current?.getClusterExpansionZoom(clusterId);
                const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;
                cameraRef.current?.easeTo({ center: [lng, lat], zoom: zoom ?? 12, duration: 350 });
                return;
            }

            const postcode = properties?.postcode as string | undefined;
            if (!postcode) return;
            setLocation({ zipcode: postcode });
            router.push('/services');
        },
        [setLocation],
    );

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
                    <Text style={styles.backLabel}>‹ Terug</Text>
                </Pressable>
                <View style={styles.headerText}>
                    <Text style={Type.page}>Waar woon je?</Text>
                    <Text style={styles.hint}>Zoek je buurt op de kaart en tik op een organisatie.</Text>
                </View>
            </View>

            <View style={styles.mapWrap}>
                {loadError ? (
                    <View style={styles.center}>
                        <Text style={Type.body}>{loadError}</Text>
                    </View>
                ) : (
                    <Map mapStyle={mapStyle} style={styles.map}>
                        <Camera bounds={NL_BOUNDS} maxBounds={NL_MAX_BOUNDS} duration={0} />
                        <Images images={{ 'zwaa-hatch': require('@/assets/map/zwaa-hatch-4x-2.png') }} />
                        {features && (
                            <GeoJSONSource
                                ref={sourceRef}
                                id="organisations"
                                data={features}
                                cluster
                                clusterRadius={48}
                                clusterMaxZoom={13}
                                onPress={handlePress}
                            >
                                <Layer
                                    id="cluster"
                                    type="circle"
                                    filter={['has', 'point_count']}
                                    style={{
                                        circleColor: '#9999FF',
                                        circleRadius: 18,
                                        circleStrokeColor: '#000066',
                                        circleStrokeWidth: 2,
                                    }}
                                />
                                <Layer
                                    id="cluster-count"
                                    type="symbol"
                                    filter={['has', 'point_count']}
                                    style={{
                                        textField: ['get', 'point_count'],
                                        textSize: 13,
                                        textColor: '#000066',
                                        textFont: ['DIN Pro Bold'],
                                    }}
                                />
                                <Layer
                                    id="org-dot"
                                    type="circle"
                                    filter={['!', ['has', 'point_count']]}
                                    style={{ circleColor: '#0000FF', circleRadius: 4 }}
                                />
                                <Layer
                                    id="org-name"
                                    type="symbol"
                                    filter={['!', ['has', 'point_count']]}
                                    style={{
                                        textField: ['get', 'name'],
                                        textSize: 11,
                                        textAnchor: 'top',
                                        textOffset: [0, 1.2],
                                        textColor: '#000080',
                                        textHaloColor: '#FFFFFF',
                                        textHaloWidth: 1,
                                    }}
                                />
                            </GeoJSONSource>
                        )}
                    </Map>
                )}
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
        alignItems: 'center',
        flexDirection: 'row',
        gap: Spacing.lg,
        padding: Spacing.lg,
    },
    back: {
        alignSelf: 'flex-start',
    },
    backLabel: {
        ...Type.body,
        color: Theme.primary,
    },
    headerText: {
        gap: Spacing.xs,
    },
    hint: {
        ...Type.bodySmall,
        color: Theme.textMuted,
    },
    mapWrap: {
        flex: 1,
        marginBottom: Spacing.lg,
        marginHorizontal: Spacing.lg,
        overflow: 'hidden',
        borderRadius: 8,
    },
    map: {
        flex: 1,
    },
    center: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
});
