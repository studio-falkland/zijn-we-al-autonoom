// Map screen: visitors zoom into the printed-map-style view of the
// Netherlands and tap providers to select them. Providers render as
// dark-blue buttons from zoom 10 (red once selected); the selection is
// managed in the panel on the right.
//
// Selecting a provider also records its postcode area as the visitor's
// location, which feeds the card's place subtitle downstream.

import type { Organisation } from '@are-we-dependent/data';
import { Camera, GeoJSONSource, Images, Layer, Map } from '@maplibre/maplibre-react-native';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { useSectorLabel } from '@/components/sectors';
import { getMapOrganisations, mapSortKey } from '@/data/organisations';
import type { SelectedService } from '@/data/services';
import { translate } from '@/i18n';
import { useTranslation } from '@/i18n/use-translation';
import { mapStyle } from '@/map/style';
import { useSessionStore } from '@/store/session';
import { Colors, Spacing, Theme, Type } from '@/theme/tokens';

// The Netherlands with margin; the camera never leaves the country.
const NL_BOUNDS: [number, number, number, number] = [3.2, 50.7, 7.3, 53.6];
const NL_MAX_BOUNDS: [number, number, number, number] = [2.5, 50.2, 8.0, 54.1];

// Providers become GeoJSON points; each carries the icon its button needs.
function toFeatures(
    organisations: Organisation[],
    selectedSlugs: Set<string>,
): GeoJSON.FeatureCollection {
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
                    postcode: org.postcode ?? '',
                    sortKey: mapSortKey(org),
                    icon: selectedSlugs.has(org.slug) ? 'provider-button-selected' : 'provider-button',
                },
            })),
    };
}

export default function MapScreen() {
    const location = useSessionStore((state) => state.location);
    const setLocation = useSessionStore((state) => state.setLocation);
    const selected = useSessionStore((state) => state.selectedServices);
    const toggleService = useSessionStore((state) => state.toggleService);
    const refreshCardData = useSessionStore((state) => state.refreshCardData);
    const { t } = useTranslation();
    const sectorLabel = useSectorLabel();
    const [organisations, setOrganisations] = useState<Organisation[] | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    // The sector label of an organisation's first classification.
    const orgSectorLabel = (org: SelectedService) => {
        const sector = org.classifications?.[0]?.sector;
        return sector ? sectorLabel(sector) : '';
    };

    // Load the map organisations once on mount.
    useEffect(() => {
        getMapOrganisations()
            .then(setOrganisations)
            .catch((error) => {
                console.error('Failed to load map organisations', error);
                setLoadError(error instanceof Error ? error.message : translate(useSessionStore.getState().language, 'map.loadError'));
            });
    }, []);

    const features = useMemo(
        () => (organisations ? toFeatures(organisations, new Set(selected.map((s) => s.slug))) : null),
        [organisations, selected],
    );

    // Tapping a provider toggles it in/out of the selection. The first
    // selection also records the visitor's postcode area.
    const handlePress = useCallback(
        (event: { nativeEvent: { features: GeoJSON.Feature[] } }) => {
            const feature = event.nativeEvent.features?.[0];
            const slug = (feature?.properties as Record<string, unknown> | null)?.slug as string | undefined;
            const org = slug ? organisations?.find((o) => o.slug === slug) : undefined;
            if (!org) return;

            toggleService(org);
            if (!location && org.postcode && org.lng != null && org.lat != null) {
                setLocation({ postcode: org.postcode, center: [org.lng, org.lat] });
            }
        },
        [organisations, location, setLocation, toggleService],
    );

    // Continue: start the card computation right away (rather than waiting on the
    // background debounce) and move on, so the reveal only waits on the render.
    const handleContinue = useCallback(() => {
        refreshCardData();
        router.push('/generate');
    }, [refreshCardData]);

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
                    <Text style={styles.backLabel}>{`‹ ${t('common.back')}`}</Text>
                </Pressable>
                <View style={styles.headerText}>
                    <Text style={Type.page}>{t('map.title')}</Text>
                    <Text style={styles.hint}>{t('map.hint')}</Text>
                </View>
            </View>

            <View style={styles.body}>
                <View style={styles.mapWrap}>
                    {loadError ? (
                        <View style={styles.center}>
                            <Text style={Type.body}>{loadError}</Text>
                        </View>
                    ) : (
                        <Map mapStyle={mapStyle} style={styles.map}>
                            <Camera bounds={NL_BOUNDS} maxBounds={NL_MAX_BOUNDS} duration={0} />
                            <Images
                                images={{
                                    'zwaa-hatch': require('@/assets/map/zwaa-hatch-4x-2.png'),
                                    'provider-button': require('@/assets/map/provider-button-4x.png'),
                                    'provider-button-selected': require('@/assets/map/provider-button-selected-4x.png'),
                                }}
                            />
                            {features && (
                                <GeoJSONSource id="organisations" data={features} onPress={handlePress}>
                                    {/* Each provider is its own dark-blue button with its name, from zoom 10 on.
                                       Buttons always render; labels that would collide are hidden by the placement
                                       engine, with municipalities placed first (symbol-sort-key). */}
                                    <Layer
                                        id="provider-button"
                                        type="symbol"
                                        minzoom={10}
                                        layout={{
                                            'icon-image': ['get', 'icon'],
                                            'icon-allow-overlap': true,
                                            'icon-text-fit': 'both',
                                            'icon-text-fit-padding': [6, 10, 6, 10],
                                            'symbol-sort-key': ['get', 'sortKey'],
                                            'text-field': ['get', 'name'],
                                            'text-font': ['DIN Pro Regular'],
                                            'text-size': 14,
                                            'text-anchor': 'center',
                                            'text-padding': 24,
                                            'text-allow-overlap': false,
                                        }}
                                        paint={{
                                            'text-color': '#FFFFFF',
                                        }}
                                    />
                                </GeoJSONSource>
                            )}
                        </Map>
                    )}
                </View>

                <View style={styles.panel}>
                    <Text style={styles.panelTitle}>{t('map.selectedCount', { count: selected.length })}</Text>
                    <FlatList
                        data={selected}
                        keyExtractor={(item) => item.slug}
                        style={styles.list}
                        contentContainerStyle={selected.length === 0 && styles.listEmpty}
                        renderItem={({ item }) => (
                            <View style={styles.row}>
                                <View style={styles.rowText}>
                                    <Text style={Type.body} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                    <Text style={styles.rowMeta}>{orgSectorLabel(item)}</Text>
                                </View>
                                <Pressable
                                    onPress={() => toggleService(item)}
                                    hitSlop={12}
                                    style={({ pressed }) => [styles.remove, pressed && styles.removePressed]}
                                >
                                    <Text style={styles.removeLabel}>×</Text>
                                </Pressable>
                            </View>
                        )}
                        ListEmptyComponent={
                            <Text style={styles.empty}>{t('map.empty')}</Text>
                        }
                    />
                    <Button
                        label={t('common.continue')}
                        disabled={selected.length === 0}
                        onPress={handleContinue}
                    />
                </View>
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
    body: {
        flex: 1,
        flexDirection: 'row',
        gap: Spacing.lg,
        marginBottom: Spacing.lg,
        paddingHorizontal: Spacing.lg,
    },
    mapWrap: {
        flex: 1,
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
    panel: {
        width: 340,
        backgroundColor: Theme.panel,
        gap: Spacing.md,
        padding: Spacing.md,
    },
    panelTitle: {
        ...Type.sub,
    },
    list: {
        flexGrow: 0,
    },
    listEmpty: {
        flexGrow: 1,
    },
    empty: {
        ...Type.bodySmall,
        color: Theme.textMuted,
        textAlign: 'center',
    },
    row: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
    },
    rowText: {
        flex: 1,
        gap: 2,
    },
    rowMeta: {
        ...Type.bodySmall,
        color: Theme.textMuted,
    },
    remove: {
        alignItems: 'center',
        borderColor: Theme.border,
        borderWidth: 1,
        borderRadius: 4,
        height: 32,
        justifyContent: 'center',
        width: 32,
    },
    removePressed: {
        backgroundColor: Colors.blue[200],
    },
    removeLabel: {
        ...Type.sub,
        color: Theme.textMuted,
        lineHeight: 24,
    },
});
