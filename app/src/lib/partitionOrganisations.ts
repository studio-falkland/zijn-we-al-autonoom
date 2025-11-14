import { US_AS } from '@/components/RatioCard/Treemap/patterns';
import { Organisation, Measurement } from '@are-we-dependent/data';
import { partition } from 'lodash';

type OrganisationForGeoJSON = Pick<Organisation, 'lat' | 'lng'> & {
    url: {
        measurements: Pick<Measurement, 'as_country_code' | 'asn'>[];
    };
};

/**
 * Transform an array of organisations into a GeoJSON layer with points for all locations
 */
export function organisationArrayToGeoJSON(data: OrganisationForGeoJSON[]): GeoJSON.FeatureCollection {
    return {
        type: 'FeatureCollection',
        features: data.map((org): GeoJSON.Feature => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [org.lng!, org.lat!],
            },
            properties: {
                // TODO: Add the organisation object to the properties if we
                // need it for the tooltip
                // organisation: JSON.parse(JSON.stringify(org)),
            },
        }))
    };
}

/**
 * Partition an array of organisations into two GeoJSON layers, of which one is
 * US-based and the other is
 */
export function partitionOrganisationsIntoGeoJSON(data: OrganisationForGeoJSON[]) {
    // Filter any organisations that have no measurements for one reason or another
    const filteredData = data.filter((o) => o.url?.measurements?.length > 0);

    // Partition the organisations into two groups based on whether they are US-based or not
    const [usBasedOrganisations, otherOrganisations] = partition(filteredData, (o) => {
        // Retrieve the latest measurement
        const measurement = o.url.measurements.at(-1);

        // GUARD: The organisation must have measurements
        if (!measurement) return false;

        // GUARD: Check if we've registered their AS country code
        if (measurement.as_country_code === 'US') return true;

        // GUARD: Fall back to checking their AS number
        if (measurement.asn && US_AS.includes(measurement.asn)) return true;

        return false;
    });

    // Convert the set of organisations intoGeoJSON
    const us = organisationArrayToGeoJSON(usBasedOrganisations);
    const other = organisationArrayToGeoJSON(otherOrganisations);
    
    return { us, other };
}