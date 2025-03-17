import db from '@/lib/db';
import { DestinationDataset, Organisation } from '@are-we-dependent/data';
import 'maplibre-gl/dist/maplibre-gl.css';
import { IsNull, Not } from 'typeorm';
import MapRenderer from '../mapRenderer';
import { partitionOrganisationsIntoGeoJSON } from '@/lib/partitionOrganisations';

export default async function WebhostingMap() {
    const data = await db.manager.find(Organisation, {
        relations: ['url.measurements'],
        where: { lat: Not(IsNull()), lng: Not(IsNull()), url: { measurements: { type: DestinationDataset.WebhostingAS }} },
    });

    const { us, other } = partitionOrganisationsIntoGeoJSON(data);

    return (
        <MapRenderer us={us} other={other} dataset={DestinationDataset.WebhostingAS} />
    );
}