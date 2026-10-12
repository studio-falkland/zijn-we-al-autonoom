// Services step: the national government services (the government_other sector).
//
// The map fills the whole screen; the right third holds the search and the
// question. Over the map floats an overview panel of the twelve predefined
// services as cards: greyed out until tapped, when they join the hand along the
// bottom. The map settings match the locked-in and category steps.
import type { Organisation } from '@are-we-dependent/data';
import { type CameraRef } from '@maplibre/maplibre-react-native';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { FannedCards } from '@/components/fanned-cards';
import { BaseMap, NL_BOUNDS } from '@/components/gather/base-map';
import { PostcodeSearch } from '@/components/gather/postcode-search';
import { CARD_DIMENSIONS, OrganisationCard } from '@/components/organisation-card';
import { GOVERNMENT_SERVICE_SLUGS } from '@/data/government-services';
import { getGovernmentServices } from '@/data/organisations';
import { type PlaceSuggestion } from '@/data/places';
import { useTranslation } from '@/i18n/use-translation';
import { useSessionStore } from '@/store/session';
import { Colors, Radii, Shadows, Spacing, Theme, Type } from '@/theme/tokens';

// A tight camera box around the visitor's point, matching the other steps.
function focusBounds(center: [number, number] | undefined): [number, number, number, number] {
    if (!center) return NL_BOUNDS;
    const [lng, lat] = center;
    const span = 0.02;
    return [lng - span, lat - span, lng + span, lat + span];
}

// The overview grid's geometry: four columns, one row per four services.
const COLUMNS = 4;
const GAP = Spacing.md;
const CARD = CARD_DIMENSIONS.small;
const GRID_ROWS = Math.ceil(GOVERNMENT_SERVICE_SLUGS.length / COLUMNS);
const GRID_WIDTH = COLUMNS * CARD.width + (COLUMNS - 1) * GAP;
const GRID_HEIGHT = GRID_ROWS * CARD.height + (GRID_ROWS - 1) * GAP;

// How far the hand sinks past the bottom edge, matching the category step.
const FAN_SINK = CARD_DIMENSIONS.medium.height / 5;

export default function GovernmentScreen() {
    const location = useSessionStore((state) => state.location);
    const selected = useSessionStore((state) => state.selectedServices);
    const toggleService = useSessionStore((state) => state.toggleService);
    const { t } = useTranslation();
    const cameraRef = useRef<CameraRef>(null);
    const [organisations, setOrganisations] = useState<Organisation[] | null>(null);
    // The overlay panel's measured inner size, so the grid can scale to fit it.
    const [panel, setPanel] = useState({ height: 0, width: 0 });

    // Load the predefined national services once on mount.
    useEffect(() => {
        let cancelled = false;
        getGovernmentServices()
            .then((result) => {
                if (!cancelled) setOrganisations(result);
            })
            .catch(() => {
                if (!cancelled) setOrganisations([]);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // The selection as a set, for the per-card selected check.
    const selectedSlugs = useMemo(() => new Set(selected.map((service) => service.slug)), [selected]);

    // Whether the visitor picked any of these services (drives the label).
    const picked = useMemo(
        () => (organisations ?? []).some((organisation) => selectedSlugs.has(organisation.slug)),
        [organisations, selectedSlugs],
    );

    // Shrink the grid to fit the free area over the map, so it stays inside on
    // smaller screens.
    const scale = useMemo(() => {
        if (panel.width <= 0 || panel.height <= 0) return 0;
        return Math.min(1, panel.width / GRID_WIDTH, panel.height / GRID_HEIGHT);
    }, [panel]);

    // Record the area's measured size; the grid scales against it.
    const handlePanelLayout = useCallback((event: LayoutChangeEvent) => {
        const { height, width } = event.nativeEvent.layout;
        setPanel({ height, width });
    }, []);

    // Choosing a search suggestion flies the camera to its centroid.
    const handleSearchSelect = useCallback((place: PlaceSuggestion) => {
        if (place.center) cameraRef.current?.flyTo({ center: place.center, zoom: 13, duration: 500 });
    }, []);

    // On to the reveal once the visitor has reviewed the national services.
    const handleAdvance = useCallback(() => router.push('/generate'), []);

    return (
        <SafeAreaView style={styles.screen}>
            {/* The map fills the whole screen; everything else floats over it. */}
            <BaseMap cameraRef={cameraRef} bounds={focusBounds(location?.center)} />
            {/* The overview: the twelve services, four to a row, over the map. */}
            <View style={styles.overlay} onLayout={handlePanelLayout}>
                {scale > 0 && (
                    <View style={[styles.grid, { height: GRID_HEIGHT, width: GRID_WIDTH, transform: [{ scale }] }]}>
                        {(organisations ?? []).map((organisation) => (
                            <Pressable key={organisation.slug} onPress={() => toggleService(organisation)}>
                                <OrganisationCard
                                    organisation={organisation}
                                    size="small"
                                    muted={selectedSlugs.has(organisation.slug)}
                                />
                            </Pressable>
                        ))}
                    </View>
                )}
            </View>
            {/* The running selection, fanned across the full width. */}
            <View style={styles.fan}>
                <FannedCards organisations={selected} onRemove={(organisation) => toggleService(organisation)} />
            </View>
            {/* The right third: the search, over the floating panel. */}
            <View style={styles.column}>
                <PostcodeSearch onSelect={handleSearchSelect} />
                <View style={styles.panel}>
                    <Text style={styles.question}>{t('services.governmentQuestion')}</Text>
                    <Text style={styles.body}>{t('services.governmentBody')}</Text>
                    <Button
                        label={picked ? t('common.continue') : t('services.skip')}
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
    // The free area over the map for the overview, clear of the hand below.
    overlay: {
        alignItems: 'center',
        bottom: 210,
        justifyContent: 'center',
        left: Spacing.lg,
        position: 'absolute',
        right: '37%',
        top: Spacing.lg,
    },
    // The grid: laid out at its natural size, over a white backdrop so a dimmed
    // card fades to the backdrop rather than to the map, then scaled to fit.
    grid: {
        backgroundColor: Colors.white,
        borderRadius: Radii.lg,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: GAP,
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
