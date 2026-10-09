// The shared MapLibre canvas for the gather section.
//
// It bundles the kiosk map style and the raster art the style references, plus a
// default Netherlands camera. Screens add their own sources, layers and gestures
// as children, and drive the camera through the optional ref — so each step can
// make the map behave differently while still sharing this shell.
import { Camera, Images, Map, type CameraRef, type MapProps } from '@maplibre/maplibre-react-native';
import type { ReactNode, Ref } from 'react';
import { StyleSheet } from 'react-native';

import { mapStyle } from '@/map/style';

// The Netherlands with margin; the camera never leaves the country.
export const NL_BOUNDS: [number, number, number, number] = [3.2, 50.7, 7.3, 53.6];
export const NL_MAX_BOUNDS: [number, number, number, number] = [2.5, 50.2, 8.0, 54.1];

// Raster art referenced by the style (the water hatch) and by pin layers.
const MAP_IMAGES = {
    'zwaa-hatch': require('@/assets/map/zwaa-hatch-4x-2.png'),
    'provider-button': require('@/assets/map/provider-button-4x.png'),
    'provider-button-selected': require('@/assets/map/provider-button-selected-4x.png'),
};

// What a gather screen may tune; everything else keeps the kiosk defaults.
export type BaseMapProps = {
    cameraRef?: Ref<CameraRef>;
    bounds?: [number, number, number, number];
    maxBounds?: [number, number, number, number];
    minZoom?: number;
    maxZoom?: number;
    onPress?: MapProps['onPress'];
    onRegionDidChange?: MapProps['onRegionDidChange'];
    children?: ReactNode;
};

// The map canvas: style, art, camera, then the screen's own layers and overlays.
export function BaseMap({
    cameraRef,
    bounds = NL_BOUNDS,
    maxBounds = NL_MAX_BOUNDS,
    minZoom,
    maxZoom,
    onPress,
    onRegionDidChange,
    children,
}: BaseMapProps) {
    return (
        <Map style={styles.map} mapStyle={mapStyle} onPress={onPress} onRegionDidChange={onRegionDidChange}>
            {/* Default NL camera; screens can re-bound it or fly/zoom via the ref. */}
            <Camera ref={cameraRef} bounds={bounds} maxBounds={maxBounds} minZoom={minZoom} maxZoom={maxZoom} duration={0} />
            {/* Art the style and pin layers reference, declared before those layers. */}
            <Images images={MAP_IMAGES} />
            {children}
        </Map>
    );
}

const styles = StyleSheet.create({
    map: {
        flex: 1,
    },
});
