// Services step: the providers a visitor is locked into by where they live.
//
// The map fills the whole screen. The right third explains the step and advances;
// the providers are dealt into the hand along the bottom, one at a time. Each is
// classified with the shared hierarchy (region, category, sector) and pinned where
// we have real coordinates. Continuing adds them to the selection, so they show up
// on the card downstream.
import {
    Category,
    GovernmentSector,
    Region,
    UtilitiesSector,
    type Organisation,
    type Sectors,
} from '@are-we-dependent/data';
import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { FannedCards } from '@/components/fanned-cards';
import { BaseMap, NL_BOUNDS } from '@/components/gather/base-map';
import { CARD_DIMENSIONS } from '@/components/organisation-card';
import { SERVICE_CATEGORIES } from '@/data/categories';
import { getLocationProviders, type LocationProviders } from '@/data/organisations';
import type { SelectedService } from '@/data/services';
import { useTranslation } from '@/i18n/use-translation';
import { useSessionStore } from '@/store/session';
import { Colors, Radii, Shadows, Spacing, Theme, Type } from '@/theme/tokens';

// PDOK returns postcodes without a space; add one for display only.
const formatPostcode = (postcode: string) => postcode.replace(/^(\d{4})([A-Z]{2})$/i, '$1 $2');

// One provider, classified by the shared hierarchy. Only the providers we
// measure carry an `organisation`, so only those can join the selection.
type LockedProvider = {
    name: string;
    region: Region;
    category: Category;
    sector: Sectors;
    organisation: Organisation | null;
    point: [number, number] | null; // [longitude, latitude], null when unknown
};

// A provider as the hand and the selection take it: a measured one as its stored
// organisation, the rest (grid operators, water company) by name and sector.
function toService(provider: LockedProvider): SelectedService {
    return (
        provider.organisation ?? {
            slug: `utility-${provider.sector}-${provider.name.toLowerCase().replace(/\s+/g, '-')}`,
            name: provider.name,
            classifications: [{ sector: provider.sector, category: provider.category, region: provider.region }],
        }
    );
}

// A one-point FeatureCollection for the visitor's dot layer (empty without one).
function pointFeature(point: [number, number] | null): GeoJSON.FeatureCollection {
    return {
        type: 'FeatureCollection',
        features: point ? [{ type: 'Feature', geometry: { type: 'Point', coordinates: point }, properties: {} }] : [],
    };
}

// The providers we can place are drawn as anchored name buttons on the map.
function pinFeatures(providers: LockedProvider[]): GeoJSON.FeatureCollection {
    return {
        type: 'FeatureCollection',
        features: providers
            .filter((provider) => provider.point)
            .map((provider) => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: provider.point as [number, number] },
                properties: { name: provider.name },
            })),
    };
}

// A tight camera box around the visitor's point, so the map opens there.
function focusBounds(center: [number, number] | undefined): [number, number, number, number] {
    if (!center) return NL_BOUNDS;
    const [lng, lat] = center;
    const span = 0.02;
    return [lng - span, lat - span, lng + span, lat + span];
}

// How far the hand sinks past the bottom edge, so the cards' lower third is cut
// off. Smaller sinks the hand less (higher); larger sinks it further.
const FAN_SINK = CARD_DIMENSIONS.medium.height / 5;
// How long between cards as the hand is dealt on arrival.
const REVEAL_DELAY = 350;

export default function ServicesScreen() {
    const location = useSessionStore((state) => state.location);
    const utilities = useSessionStore((state) => state.utilities);
    const addServices = useSessionStore((state) => state.addServices);
    const { t } = useTranslation();
    const [providers, setProviders] = useState<LocationProviders | null>(null);
    // How many cards have been dealt into the hand so far.
    const [revealed, setRevealed] = useState(0);

    // Resolve the municipality and water authority. The municipality name comes
    // from the PDOK document, or from the nearest local pin when PDOK was
    // unreachable (the offline fallback location); the water authority arrives
    // with the utility lookup, a moment later.
    useEffect(() => {
        if (!location) return;
        const names = {
            gemeente: location.pdok?.gemeentenaam,
            waterschap: utilities?.waterschap ?? undefined,
            center: location.center,
        };

        let cancelled = false;
        getLocationProviders(names)
            .then((result) => {
                if (!cancelled) setProviders(result);
            })
            // A failed lookup leaves `providers` null; the cards then fall back
            // to the names we already hold.
            .catch(() => {
                if (!cancelled) setProviders(null);
            });
        return () => {
            cancelled = true;
        };
    }, [location, utilities]);

    // The location's providers, classified by the hierarchy and de-duplicated by
    // name, so an operator serving both gas and electricity appears only once.
    const cards = useMemo<LockedProvider[]>(() => {
        const at = (org: Organisation | null): [number, number] | null =>
            org && org.lng != null && org.lat != null ? [org.lng, org.lat] : null;

        const list: LockedProvider[] = [];
        const seen = new Set<string>();
        const add = (provider: LockedProvider) => {
            const key = provider.name.trim().toLowerCase();
            if (!key || seen.has(key)) return;
            seen.add(key);
            list.push(provider);
        };

        // Who you answer to. Both show from their name even when we cannot match
        // them to an organisation, so the water authority is never left out.
        const municipality = providers?.municipality ?? null;
        const gemeente = municipality?.name ?? location?.pdok?.gemeentenaam;
        if (gemeente) {
            add({
                name: gemeente, region: Region.Local, category: Category.Government,
                sector: GovernmentSector.Municipality, organisation: municipality, point: at(municipality),
            });
        }
        const waterschap = providers?.waterschap ?? null;
        const waterschapName = waterschap?.name ?? utilities?.waterschap ?? undefined;
        if (waterschapName) {
            add({
                name: waterschapName, region: Region.Local, category: Category.Government,
                sector: GovernmentSector.WaterBoard, organisation: waterschap, point: at(waterschap),
            });
        }

        // What keeps you running: the grid operators and the water company.
        if (utilities?.netbeheerderElektra) {
            add({
                name: utilities.netbeheerderElektra, region: Region.Local, category: Category.Utilities,
                sector: UtilitiesSector.Power, organisation: null, point: null,
            });
        }
        if (utilities?.netbeheerderGas) {
            add({
                name: utilities.netbeheerderGas, region: Region.Local, category: Category.Utilities,
                sector: UtilitiesSector.Power, organisation: null, point: null,
            });
        }
        if (utilities?.drinkwater) {
            add({
                name: utilities.drinkwater, region: Region.Local, category: Category.Utilities,
                sector: UtilitiesSector.Water, organisation: null, point: null,
            });
        }
        return list;
    }, [location, providers, utilities]);

    // Deal the hand one card at a time, chasing the list as the providers resolve.
    useEffect(() => {
        if (revealed >= cards.length) return;
        const timer = setTimeout(() => setRevealed((count) => count + 1), REVEAL_DELAY);
        return () => clearTimeout(timer);
    }, [revealed, cards.length]);

    const hand = useMemo(() => cards.slice(0, revealed).map(toService), [cards, revealed]);

    // Adding every locked-in provider to the selection, then on to the first
    // category (or straight to the card).
    const handleContinue = useCallback(() => {
        const selection = cards.map(toService);
        if (selection.length > 0) addServices(selection);
        const first = SERVICE_CATEGORIES[0];
        if (first) router.push({ pathname: '/services/[category]', params: { category: first.key } });
        else router.push('/generate');
    }, [addServices, cards]);

    return (
        <SafeAreaView style={styles.screen}>
            {/* The map fills the whole screen; the column and the hand float over it. */}
            <BaseMap bounds={focusBounds(location?.center)}>
                {/* The visitor, drawn as the same anchored dot as in gather. */}
                <GeoJSONSource id="visitor-point" data={pointFeature(location?.center ?? null)}>
                    <Layer
                        id="visitor-point-dot"
                        type="circle"
                        paint={{
                            'circle-color': Colors.blue[900],
                            'circle-radius': 7,
                            'circle-stroke-color': Colors.white,
                            'circle-stroke-width': 2,
                        }}
                    />
                </GeoJSONSource>
                {/* The providers we can place, as their navy name buttons. */}
                <GeoJSONSource id="locked-providers" data={pinFeatures(cards)}>
                    <Layer
                        id="locked-providers-button"
                        type="symbol"
                        layout={{
                            'icon-image': 'provider-button-selected',
                            'icon-allow-overlap': true,
                            'icon-text-fit': 'both',
                            'icon-text-fit-padding': [6, 10, 6, 10],
                            'text-field': ['get', 'name'],
                            'text-font': ['DIN Pro Regular'],
                            'text-size': 14,
                            'text-anchor': 'center',
                        }}
                        paint={{ 'text-color': Colors.white }}
                    />
                </GeoJSONSource>
            </BaseMap>
            {/* The hand, dealt one card at a time, across the full width. */}
            <View style={styles.fan}>
                <FannedCards organisations={hand} />
            </View>
            {/* The right third: the explanation and the action. */}
            <View style={styles.column}>
                <View style={styles.panel}>
                    <Text style={styles.heading}>{t('services.heading')}</Text>
                    {location?.postcode && <Text style={styles.subtitle}>{formatPostcode(location.postcode)}</Text>}
                    <Text style={styles.body}>
                        {cards.length === 0 ? t('services.finding') : t('services.explainer')}
                    </Text>
                    <Button
                        label={t('common.continue')}
                        onPress={handleContinue}
                        disabled={cards.length === 0}
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
    // The right third: the explanation, over the map.
    column: {
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
        gap: Spacing.md,
        padding: Spacing.lg,
        ...Shadows.boxSmall,
    },
    heading: {
        ...Type.sub,
        fontSize: 20,
        lineHeight: 20,
    },
    subtitle: {
        ...Type.bodySmall,
        color: Theme.textMuted,
    },
    body: {
        ...Type.bodyLarge,
        fontSize: 20,
        lineHeight: 24,
    },
    // The hand, across the full width of the screen.
    fan: {
        bottom: -FAN_SINK,
        left: 0,
        position: 'absolute',
        right: 0,
    },
});
