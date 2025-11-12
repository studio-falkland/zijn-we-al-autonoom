import { RemoteDatasetTask } from '@/lib/task/RemoteDatasetTask.js';
import { OSMAmenity, OverpassResponse } from './types.js';
import { HealthcareSector, Category, Region, Sectors } from '@are-we-dependent/data';
import { DatasetDatum } from '@/lib/task/DatasetTask.js';
import { groups } from 'd3';

const OVERPASS_API_HOST = 'https://overpass.private.coffee/api/interpreter';

const OVERPASS_QUERY = `
[out:json][timeout:120];
area["ISO3166-1"="NL"]->.netherlands;
(
  node["amenity"~"dentist|clinic|doctors|nursing_home|pharmacy|hospital"]["website"](area.netherlands);
  way["amenity"~"dentist|clinic|doctors|nursing_home|pharmacy|hospital"]["website"](area.netherlands);
  relation["amenity"~"dentist|clinic|doctors|nursing_home|pharmacy|hospital"]["website"](area.netherlands);
);
out center;
`.trim();

export default class RetrieveOpenStreetMapData extends RemoteDatasetTask {
    name = 'retrieve-open-street-map-entities';
    description = 'Retrieving Open Street Map entities'

    async onStart() {
        // Retrieve the dataset based on the given URL
        const retrievalResult = await this.retrieveDatasetFromURL(
            'open-street-map',
            OVERPASS_API_HOST,
            { 
                method: 'POST',
                body: new URLSearchParams({ data: OVERPASS_QUERY }).toString(),
            }
        );

        // GUARD: Check if the result was successfully retrieved
        if (!retrievalResult) return this.finish();
        const { data, dataset } = retrievalResult;

        // Parse the data into a JSON object
        const text = new TextDecoder().decode(data)
        const { elements }: OverpassResponse = JSON.parse(text);

        // Loop through all returned entities
        const organisations: (DatasetDatum & { sector: Sectors })[] = elements
            // Filter any organisations without a name
            .filter((f) => !!f.tags.name)
            .map((feature) => {
                // Map the OSM format to our organisation format
                return {
                    organisation: {
                        name: feature.tags.name!,
                        address: feature.tags['addr:street'] && feature.tags['addr:housenumber']
                            ? `${feature.tags['addr:street']} ${feature.tags['addr:housenumber']}`
                            : undefined,
                        postcode: feature.tags['addr:postcode'],
                        city: feature.tags['addr:city'],
                        lat: feature.lat,
                        lng: feature.lon,
                    },
                    url: feature.tags.website,
                    sector: this.mapAmenityToHealthcareSector(feature.tags.amenity),
                }
            });

        this.log(`Retrieved ${organisations.length} valid entities from OpenStreetMap`);
        this.updateTotal(organisations.length);

        // Group into sector and insert them into the database
        for await (const [sector, data] of groups(organisations, (o) => o.sector)) {
            await this.insertOrUpdate(
                dataset,
                data,
                {
                    sector,
                    region: Region.Local,
                    category: Category.Healthcare
                }
            );

            this.updateProgress((n) => n + data.length);
        }

        // Finish task
        await this.finishDataset(dataset);
        this.finish();
    }

    mapAmenityToHealthcareSector(amenity: OSMAmenity) {
        switch (amenity) {
            case "doctors":
                return HealthcareSector.Hospital;
            case "nursing_home":
                return HealthcareSector.NursingHome;
            case "dentist":
                return HealthcareSector.Dentist;
            case "pharmacy":
                return HealthcareSector.Pharmacy;
            case "hospital":
                return HealthcareSector.Hospital;
            default:
                return HealthcareSector.Other;
        }
    }
}