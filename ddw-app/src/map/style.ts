// Standalone MapLibre style reproducing the DDW map design.
// The Mapbox Studio style ("Zijn we al autonoom - Rotterdam") is built on
// Mapbox Standard style imports, which MapLibre cannot parse. Its custom
// layers are ported here against Mapbox's public tile and font APIs.

import type { StyleSpecification } from '@maplibre/maplibre-react-native';

// Public Mapbox token scoped to this kiosk app (hardcoded per the user's setup).
export const MAPBOX_ACCESS_TOKEN =
    'REMOVED_MAPBOX_TOKEN';

// Mapbox hosts the streets-v8 tileset referenced by the Studio style.
const STREETS_TILES = `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/{z}/{x}/{y}.vector.pbf?access_token=${MAPBOX_ACCESS_TOKEN}`;

// The Mapbox Fonts API serves the same font stack used in Mapbox Studio.
const GLYPHS = `https://api.mapbox.com/fonts/v1/mapbox/{fontstack}/{range}.pbf?access_token=${MAPBOX_ACCESS_TOKEN}`;

// The palette from the Studio style's custom layers.
const Palette = {
    background: '#f1f1f8',
    waterFill: '#f6f6ff',
    waterOutline: '#0000ff',
    ink: '#000066',
    label: '#000080',
    labelHalo: 'hsla(0, 0%, 100%, 1)',
} as const;

// The DDW map: a light base, hatched water, subtle roads and admin lines,
// and blue-dotted place labels — ported from the Studio layers 1:1.
export const mapStyle: StyleSpecification = {
    version: 8,
    name: 'Zijn we al autonoom (MapLibre)',
    sources: {
        composite: {
            type: 'vector',
            tiles: [STREETS_TILES],
        },
    },
    glyphs: GLYPHS,
    layers: [
        {
            id: 'background',
            type: 'background',
            paint: {
                'background-color': Palette.background,
            },
        },
        {
            // Water is hatched with the zwaa pattern and a blue outline.
            id: 'water',
            type: 'fill',
            source: 'composite',
            'source-layer': 'water',
            paint: {
                'fill-color': Palette.waterFill,
                'fill-opacity': 0.1,
                'fill-outline-color': Palette.waterOutline,
                'fill-pattern': 'zwaa-hatch',
            },
        },
        {
            // A crisp ink-blue line around the water bodies.
            id: 'water-line',
            type: 'line',
            source: 'composite',
            'source-layer': 'water',
            layout: {
                'line-cap': 'round',
                'line-join': 'round',
            },
            paint: {
                'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 0, 0.5, 16, 2],
                'line-color': Palette.ink,
                'line-opacity': 0.2,
            },
        },
        {
            // Roads at 4% ink read as a faint printed-map texture.
            id: 'roads',
            type: 'line',
            source: 'composite',
            'source-layer': 'road',
            layout: {
                'line-cap': 'round',
                'line-join': 'round',
            },
            paint: {
                'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 0, 0.5, 16, 5],
                'line-color': Palette.ink,
                'line-opacity': 0.04,
            },
        },
        {
            // Administrative boundaries fade with level, like the Studio layer.
            id: 'admin',
            type: 'line',
            source: 'composite',
            'source-layer': 'admin',
            layout: {
                'line-cap': 'round',
                'line-join': 'round',
            },
            paint: {
                'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 0, 0.5, 16, 5],
                'line-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'admin_level'],
                    0,
                    '#000085',
                    2,
                    'rgba(20, 20, 255, 0.08)',
                ],
            },
        },
        {
            // The blue dot under each place label (sprite icon replaced by a circle layer).
            id: 'place-dot',
            type: 'circle',
            source: 'composite',
            'source-layer': 'place_label',
            paint: {
                'circle-color': '#0000ff',
                'circle-radius': 2.5,
            },
        },
        {
            // Place names in the label blue, largest settlements first.
            id: 'place-label',
            type: 'symbol',
            source: 'composite',
            'source-layer': 'place_label',
            layout: {
                'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name']],
                'text-font': ['DIN Pro Regular', 'Arial Unicode MS Regular'],
                'text-size': 11,
                'text-anchor': 'top',
                'text-offset': [0, 0.5],
                'text-padding': 32,
                'symbol-sort-key': ['get', 'symbolrank'],
            },
            paint: {
                'text-color': Palette.label,
                'text-halo-color': Palette.labelHalo,
                'text-halo-width': 1,
            },
        },
    ],
};
