'use client';
import { useRedButton } from '@/components/RedButton/context';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { getIconForDataset } from '@/lib/icons';
import { getDatasetLabel } from '@/lib/labels';
import { DestinationDataset } from '@are-we-dependent/data';
import { Map as BaseMap, Layer, Source } from '@vis.gl/react-maplibre';
import { Map } from 'lucide-react';

export interface MapRendererProps {
    us: GeoJSON.FeatureCollection,
    other: GeoJSON.FeatureCollection,
    dataset: DestinationDataset,
}

export default function MapRenderer({ us, other, dataset }: MapRendererProps) {
    const [isRedButtonActive] = useRedButton();

    const DatasetIcon = getIconForDataset(dataset);

    return (
        <>
            <Breadcrumb className="mb-6">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Zijn we al autonoom?</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/map" className="flex items-center gap-2">
                            <Map className="w-3 h-3" />
                            Kaart
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href={`/map/${dataset}`} className="flex items-center gap-2">
                            <DatasetIcon className="w-3 h-3" />
                            {getDatasetLabel(dataset)}
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <BaseMap
                initialViewState={{
                    latitude: 52.1009,
                    longitude: 5.6462,
                    zoom: 7.2,
                }}
                style={{ width: '100%', height: 'calc(100vh - 240px)', borderRadius: 16 }}
                mapStyle="https://tiles.versatiles.org/assets/styles/colorful/style.json"
                interactiveLayerIds={['other_as', 'us_as']}
                onClick={(e) => console.log('Click', e.features)}
            >
                <Source type="geojson" data={other}>
                    <Layer
                        id="other_as"
                        type="circle"
                        paint={{
                            "circle-color": "#0000ff88",
                            "circle-radius": [
                                "interpolate",
                                ["exponential", 1.4],
                                ["zoom"],
                                5, 1,
                                20, 100,
                            ],
                        }}
                    />
                </Source>
                <Source type="geojson" data={us} >
                    <Layer
                        id="us_as"
                        type="circle"
                        paint={{
                            "circle-color": isRedButtonActive ? "#ff000088" : "#0000ff88",
                            "circle-radius": [
                                "interpolate",
                                ["exponential", 1.4],
                                ["zoom"],
                                5, 1,
                                20, 100,
                            ],
                        }}
                    />
                </Source>
            </BaseMap>
        </>
    )
}