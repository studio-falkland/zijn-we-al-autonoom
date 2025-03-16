'use client';
import { useRedButton } from '@/components/RedButton/context';
import { Map as BaseMap, Layer, Source } from '@vis.gl/react-maplibre';

export interface MapRendererProps {
    us: GeoJSON.FeatureCollection,
    other: GeoJSON.FeatureCollection,
}

export default function MapRenderer({ us, other }: MapRendererProps) {
    const [isRedButtonActive] = useRedButton();

    return (
        <BaseMap
            initialViewState={{
                latitude: 52.1009,
                longitude: 5.6462,
                zoom: 6.8,
            }}
            style={{ width: '100%', height: 800, borderRadius: 16 }}
            mapStyle="https://tiles.versatiles.org/assets/styles/colorful/style.json"
        >
            <Source type="geojson" data={other}>
                <Layer type="circle" paint={{
                    "circle-color": "#0000ff",
                    "circle-radius": 2,
                }} />
            </Source>
            <Source type="geojson" data={us}>
                <Layer type="circle" paint={{
                    "circle-color": isRedButtonActive ? "#ff0000" : "#0000ff",
                    "circle-radius": 2,
                    
                }} />
            </Source>
        </BaseMap>
    )
}