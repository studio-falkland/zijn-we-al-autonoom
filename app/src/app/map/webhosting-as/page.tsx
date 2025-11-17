import { DestinationDataset, Organisation, Measurement } from '@are-we-dependent/data';
import 'maplibre-gl/dist/maplibre-gl.css';
import MapRenderer from '../mapRenderer';
import { partitionOrganisationsIntoGeoJSON } from '@/lib/partitionOrganisations';
import { getLatestMeasurements } from '@/lib/queries';

type OrganisationWithMeasurements = Pick<Organisation, 'lat' | 'lng'> & {
    url: {
        measurements: Pick<Measurement, 'as_country_code' | 'asn'>[];
    };
};

export default async function WebhostingMap() {
    const data = await getLatestMeasurements(DestinationDataset.WebhostingAS, undefined, undefined, { requireCoordinates: true });

    // Transform our optimized query results to match Organisation structure expected by partitionOrganisationsIntoGeoJSON
    const transformedData: OrganisationWithMeasurements[] = data.map(url => ({
        lat: url.organisation.lat!,
        lng: url.organisation.lng!,
        url: {
            measurements: url.measurements
        }
    }));

    const { us, other } = partitionOrganisationsIntoGeoJSON(transformedData);

    return (
        <MapRenderer us={us} other={other} dataset={DestinationDataset.WebhostingAS} />
    );
}