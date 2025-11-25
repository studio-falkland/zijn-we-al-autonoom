'use client';
import { URL } from '@are-we-dependent/data';
import { LatestMeasurementResult } from '@/lib/queries';
import { Map as BaseMap, Marker } from '@vis.gl/react-maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { PropsWithChildren } from 'react';
import { useRedButton } from '../RedButton/context';

export interface MapProps {
    data?: URL[] | LatestMeasurementResult[];
    children?: React.ReactNode;
    height?: number;
}

export default function Map({ data, children, height }: PropsWithChildren<MapProps>) {
    const [isRedButtonActive] = useRedButton();

    return (
        <BaseMap
            initialViewState={{
                latitude: 52.1009,
                longitude: 5.6462,
                zoom: 5.8,
            }}
            style={{width: '100%', height: height ?? 400}}
            mapStyle="https://tiles.versatiles.org/assets/styles/colorful/style.json"
        >
            {data?.map((url) => url.organisation.lat && url.organisation.lng && (
                <Marker
                    key={url.id}
                    anchor="center"
                    latitude={url.organisation.lat}
                    longitude={url.organisation.lng}
                >
                    <svg width="4" height="4">
                        <circle
                            fill={isRedButtonActive && url.measurements?.at(-1)?.as_country_code === 'US' ? '#ff0000' : '#0000ff'}
                            cx={2}
                            cy={2}
                            r={2}
                        />
                    </svg>
                </Marker>
            ))}
            {children}
        </BaseMap>
    );
}