import db from '@/lib/db';
import { DestinationDataset, Organisation } from '@are-we-dependent/data';
import 'maplibre-gl/dist/maplibre-gl.css';
import { IsNull, Not } from 'typeorm';
import MapRenderer from './mapRenderer';
import { partition } from 'lodash';
import { US_AS } from '@/components/RatioCard/Treemap/patterns';

function organisationArrayToGeoJSON(data: Organisation[]): GeoJSON.FeatureCollection {
    return {
        type: 'FeatureCollection',
        features: data.map((org): GeoJSON.Feature => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [org.lng!, org.lat!],
            },
            properties: {
                name: org.name,
                asn: org.url.measurements.at(-1)?.asn,
                cc: org.url.measurements.at(-1)?.as_country_code,
            },
        }))
    };
}

export default async function MapPage() {
    const data = await db.manager.find(Organisation, {
        relations: ['url.measurements'],
        where: { lat: Not(IsNull()), lng: Not(IsNull()), url: { measurements: { type: DestinationDataset.EmailAS }} },
    });

    const filteredData = data.filter((o) => o.url?.measurements?.length > 0);
    console.log(filteredData);

    const [us, other] = partition(filteredData, (o) => {
        const measurement = o.url.measurements.at(-1);
        if (!measurement) return false;
        if (measurement.as_country_code === 'US') return true;
        if (measurement.asn && US_AS.includes(measurement.asn)) return true;
        return false;
    });
    const usData = organisationArrayToGeoJSON(us);
    const otherData = organisationArrayToGeoJSON(other);
    
    return (
        <MapRenderer us={usData} other={otherData} />
    );
}