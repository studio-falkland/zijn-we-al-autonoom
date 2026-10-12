// Services step: the providers a visitor is locked into by where they live.
//
// After choosing a postcode we resolve the municipality and water authority in
// our own data, and read the grid operators and water company the location
// resolves to at runtime. Each provider is classified with the shared hierarchy
// (region, category, sector) and shown as a portrait card over the map, pinned
// where we have real coordinates. Continuing adds the providers we measure to
// the visitor's selection, so they show up on the card downstream.
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
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { CardBody, CardIcon, CardPatternedBackground } from '@/components/card/card-body';
import { CardContainer } from '@/components/card/card-container';
import { CardHeader, CardSubtitle, CardTitle } from '@/components/card/card-header';
import { BaseMap, NL_BOUNDS } from '@/components/gather/base-map';
import { SectorIcon, sectorLabel } from '@/components/sectors';
import { SERVICE_CATEGORIES } from '@/data/categories';
import { getLocationProviders, type LocationProviders } from '@/data/organisations';
import { useSessionStore } from '@/store/session';
import { Colors, Spacing, Theme, Type } from '@/theme/tokens';

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

export default function ServicesScreen() {
    const location = useSessionStore((state) => state.location);
    const utilities = useSessionStore((state) => state.utilities);
    const addServices = useSessionStore((state) => state.addServices);
    const [providers, setProviders] = useState<LocationProviders | null>(null);

    // Resolve the municipality and water authority once their names are known
    // (the water authority arrives with the utility lookup, a moment later).
    useEffect(() => {
        const names = { gemeente: location?.pdok?.gemeentenaam, waterschap: utilities?.waterschap ?? undefined };
        if (!names.gemeente && !names.waterschap) return;

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

    // Adding the measured providers to the selection, then on to the card.
    const handleContinue = useCallback(() => {
        const measured = cards
            .map((card) => card.organisation)
            .filter((organisation): organisation is Organisation => organisation !== null);
        if (measured.length > 0) addServices(measured);
        // Hand off to the first category step (or straight to the card).
        const first = SERVICE_CATEGORIES[0];
        if (first) router.push({ pathname: '/services/[category]', params: { category: first.key } });
        else router.push('/generate');
    }, [addServices, cards]);

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.mapWrap}>
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
                {/* The question, over the top edge of the map. */}
                <View style={styles.headingWrap}>
                    <Text style={styles.heading}>These come with where you live</Text>
                    {location && <Text style={styles.subtitle}>{formatPostcode(location.postcode)}</Text>}
                </View>
                {/* The provider cards: a portrait deck over the bottom of the map. */}
                <View style={styles.deck}>
                    {cards.length === 0 ? (
                        <Text style={styles.empty}>Finding your providers…</Text>
                    ) : (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.deckContent}
                        >
                            {cards.map((card) => (
                                <CardContainer key={`${card.sector}-${card.name}`} style={styles.cardBody}>
                                    <CardHeader>
                                        <CardTitle numberOfLines={2}>{card.name}</CardTitle>
                                        <CardSubtitle>{sectorLabel(card.sector)}</CardSubtitle>
                                    </CardHeader>
                                    <CardBody>
                                        <CardPatternedBackground />
                                        <CardIcon>
                                            <SectorIcon sector={card.sector} width={90} height={120} />
                                        </CardIcon>
                                    </CardBody>
                                </CardContainer>
                            ))}
                        </ScrollView>
                    )}
                    <Button label="Continue" onPress={handleContinue} disabled={cards.length === 0} />
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
    mapWrap: {
        flex: 1,
        position: 'relative',
    },
    headingWrap: {
        gap: Spacing.xs,
        left: Spacing.lg,
        position: 'absolute',
        right: Spacing.lg,
        top: Spacing.xxxl,
    },
    heading: {
        ...Type.sub,
    },
    subtitle: {
        ...Type.bodySmall,
        color: Theme.textMuted,
    },
    deck: {
        bottom: Spacing.lg,
        gap: Spacing.md,
        left: Spacing.lg,
        position: 'absolute',
        right: Spacing.lg,
    },
    deckContent: {
        gap: Spacing.md,
        paddingBottom: Spacing.sm
    },
    cardBody: {
        height: 300,
        width: 190,
    },
    empty: {
        ...Type.bodySmall,
        color: Theme.textMuted,
    },
});
