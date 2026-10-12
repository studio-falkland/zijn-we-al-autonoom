// Services step, one screen per category.
//
// After the locked-in providers, the visitor reviews each category in turn on
// the same map, taps the providers they use, and moves on. The button reads
// "Skip" until something in the category is picked, then "Continue". The map
// settings match the locked-in step throughout.
import type { Organisation } from '@are-we-dependent/data';
import { GeoJSONSource, Layer, type CameraRef } from '@maplibre/maplibre-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { FannedCards } from '@/components/fanned-cards';
import { BaseMap, NL_BOUNDS } from '@/components/gather/base-map';
import { PostcodeSearch } from '@/components/gather/postcode-search';
import { CARD_DIMENSIONS } from '@/components/organisation-card';
import { findCategory, nextCategory } from '@/data/categories';
import { getCategoryOrganisations } from '@/data/organisations';
import { type PlaceSuggestion } from '@/data/places';
import { useSessionStore } from '@/store/session';
import { Colors, Radii, Shadows, Spacing, Theme, Type } from '@/theme/tokens';

// Providers become GeoJSON points; each carries the icon its button needs.
function toFeatures(organisations: Organisation[], selectedSlugs: Set<string>): GeoJSON.FeatureCollection {
    return {
        type: 'FeatureCollection',
        features: organisations
            .filter((org) => org.lat != null && org.lng != null)
            .map((org) => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [org.lng as number, org.lat as number] },
                properties: {
                    slug: org.slug,
                    name: org.name,
                    icon: selectedSlugs.has(org.slug) ? 'provider-button-selected' : 'provider-button',
                },
            })),
    };
}

// A tight camera box around the visitor's point, matching the locked-in step.
function focusBounds(center: [number, number] | undefined): [number, number, number, number] {
    if (!center) return NL_BOUNDS;
    const [lng, lat] = center;
    const span = 0.02;
    return [lng - span, lat - span, lng + span, lat + span];
}

// How far the hand sinks past the bottom edge, so the cards' lower third is cut
// off. Smaller sinks the hand less (higher); larger sinks it further.
const FAN_SINK = CARD_DIMENSIONS.medium.height / 5;

export default function CategoryScreen() {
    const { category } = useLocalSearchParams<{ category: string }>();
    const current = findCategory(category ?? '');
    const location = useSessionStore((state) => state.location);
    const selected = useSessionStore((state) => state.selectedServices);
    const toggleService = useSessionStore((state) => state.toggleService);
    const cameraRef = useRef<CameraRef>(null);
    const [organisations, setOrganisations] = useState<Organisation[] | null>(null);

    // Load the category's providers around the visitor, once both are known.
    useEffect(() => {
        if (!location?.center || !current) return;
        let cancelled = false;

        getCategoryOrganisations(location.center, current.category)
            .then((result) => {
                if (!cancelled) setOrganisations(result);
            })
            .catch(() => {
                if (!cancelled) setOrganisations([]);
            });
        return () => {
            cancelled = true;
        };
    }, [location, current]);

    const features = useMemo(
        () => (organisations ? toFeatures(organisations, new Set(selected.map((s) => s.slug))) : null),
        [organisations, selected],
    );

    // Whether the visitor picked something from this category (drives the label).
    const picked = useMemo(
        () => selected.some((service) => service.classifications?.some((c) => c.category === current?.category)),
        [selected, current],
    );

    // Tapping a provider toggles it in or out of the selection.
    const handlePress = useCallback(
        (event: { nativeEvent: { features: GeoJSON.Feature[] } }) => {
            const properties = event.nativeEvent.features?.[0]?.properties as Record<string, unknown> | null;
            const slug = properties?.slug as string | undefined;
            const organisation = slug ? organisations?.find((org) => org.slug === slug) : undefined;
            if (organisation) toggleService(organisation);
        },
        [organisations, toggleService],
    );

    // Choosing a search suggestion flies the camera to its centroid.
    const handleSearchSelect = useCallback((place: PlaceSuggestion) => {
        if (place.center) cameraRef.current?.flyTo({ center: place.center, zoom: 13, duration: 500 });
    }, []);

    // Advance to the next category, or to the card once past the last one.
    const handleAdvance = useCallback(() => {
        if (!current) return;
        const next = nextCategory(current.key);
        if (next) router.push({ pathname: '/services/[category]', params: { category: next } });
        else router.push('/generate');
    }, [current]);

    if (!current) return null;

    return (
        <SafeAreaView style={styles.screen}>
            {/* The map fills the whole screen; everything else floats over it. */}
            <BaseMap cameraRef={cameraRef} bounds={focusBounds(location?.center)}>
                {features && (
                    <GeoJSONSource id="category-providers" data={features} onPress={handlePress}>
                        {/* Each provider is a navy name button, solid once selected. */}
                        <Layer
                            id="category-provider-button"
                            type="symbol"
                            minzoom={10}
                            layout={{
                                'icon-image': ['get', 'icon'],
                                'icon-allow-overlap': true,
                                'icon-text-fit': 'both',
                                'icon-text-fit-padding': [6, 10, 6, 10],
                                'text-field': ['get', 'name'],
                                'text-font': ['DIN Pro Regular'],
                                'text-size': 14,
                                'text-anchor': 'center',
                                'text-padding': 12,
                                'text-allow-overlap': false,
                            }}
                            paint={{ 'text-color': Colors.white }}
                        />
                    </GeoJSONSource>
                )}
            </BaseMap>
            {/* The running selection, fanned across the full width. */}
            <View style={styles.fan}>
                <FannedCards organisations={selected} onRemove={(organisation) => toggleService(organisation)} />
            </View>
            {/* The right third: the search, over a floating panel. */}
            <View style={styles.column}>
                <PostcodeSearch onSelect={handleSearchSelect} />
                <View style={styles.panel}>
                    <Text style={styles.question}>{current.question}</Text>
                    <Text style={styles.body}>Select them on the map.</Text>
                    <Button
                        label={picked ? 'Continue' : "I don't use any"}
                        onPress={handleAdvance}
                        size="small"
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        backgroundColor: Theme.background,
        flex: 1,
    },
    // The right third: the search over the floating panel.
    column: {
        gap: Spacing.md,
        position: 'absolute',
        right: Spacing.lg,
        top: Spacing.lg,
        width: '33%',
    },
    // The floating panel: same stroke and shadow as the search field.
    panel: {
        backgroundColor: Colors.white,
        borderColor: Colors.blue[800],
        borderRadius: Radii.md,
        borderWidth: 1,
        gap: Spacing.lg,
        padding: Spacing.lg,
        ...Shadows.boxSmall,
    },
    // The hand, across the full width of the screen.
    fan: {
        bottom: -FAN_SINK,
        left: 0,
        position: 'absolute',
        right: 0,
    },
    question: {
        ...Type.sub,
        fontSize: 20,
        lineHeight: 20,
    },
    body: {
        ...Type.bodyLarge,
        fontSize: 20,
        lineHeight: 24,
    },
});
