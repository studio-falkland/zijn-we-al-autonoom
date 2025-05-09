import DatasetTask from '@/lib/task/DatasetTask.js';
import db, { Organisation } from '@are-we-dependent/data';
import { PromisePool } from '@supercharge/promise-pool';
import { IsNull, Not } from 'typeorm'

const PDOK_URI = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/free';

interface PDOKResponse {
    response: {
        numFound: number;
        start: number;
        maxScore: number;
        numFoundExact: boolean;
        docs: {
            woonplaatsnaam: string;
            centroide_ll: string;
            huisnummer: number;
            straatnaam: string;
            postcode: string;
        }[]
    }
}

function compare(a: string, b: string) {
    return a.localeCompare(b, 'nl', { sensitivity: 'accent' }) === 0;
}

export default class GeocodeOrganisationAddresses extends DatasetTask {
    name = 'kadaster';
    description = 'Retrieving coordinates for organisations addresses';

    async onStart() {
        // The cache key for this dataset is the current date
        const date = new Date();
        date.setUTCHours(0, 0, 0, 0);

        const { dataset } = await this.retrieveAndMatchDataset(
            'kadaster-pdok-lookup',
            PDOK_URI,
            () => Promise.resolve({ cacheKey: date.toISOString() }),
        ) || {};

        if (!dataset) return this.finish();

        const organisations = await db.manager.find(Organisation, {
            where: {
                lat: IsNull(),
                lng: IsNull(),
                city: Not(IsNull()),
                postcode: Not(IsNull()),
                address: Not(IsNull()),
                active: true,
            },
        });
        
        this.log(`${organisations.length} organisations are still missing coordinates`);
        this.updateTotal(organisations.length);

        const { results, errors } = await PromisePool
            .withConcurrency(10)
            .withTaskTimeout(5_000)
            .for(organisations)
            .process(async (organisation) => {
                // Make a bag of address parameters for the organisation
                const params = [organisation.address, organisation.city, organisation.postcode];

                // Prepare the query parameters
                const query = new URLSearchParams({
                    q: params.filter((p) => !!p).join(' '),
                    fl: 'centroide_ll huisnummer straatnaam woonplaatsnaam postcode'
                });

                // Request matching addresses
                const response = await fetch(`${PDOK_URI}?${query.toString()}`);

                // GUARD: Check that response was retrieved succesfully
                if (!response.ok) {
                    throw new Error(`Failed to retrieve PDOK data (${response.status} ${response.statusText})`);
                }

                // Parse data into JSON
                const data = await response.json() as PDOKResponse;
                
                // Attempt to find an exact match in the dataset
                const match = data.response.docs.find((d) => (
                    compare(d.postcode, organisation.postcode.replace(' ', ''))
                    && compare(`${d.straatnaam} ${d.huisnummer}`, organisation.address)
                    && compare(d.woonplaatsnaam, organisation.city)
                ));

                this.updateProgress((n) => n + 1);

                // GUARD: Check if there's a mtach
                if (!match) {
                    throw new Error('Could not find exact match');
                }

                // Parse the WKT Point into a lat and lng
                const coords = /\(\s?(\S+)\s+(\S+)\s?\)/.exec(match.centroide_ll);
                if (!coords) {
                    this.log(`Failed to parse coordinates: ${match.centroide_ll}`);
                    throw new Error('Failed to match coordinates');
                }

                organisation.lng = Number.parseFloat(coords[1]);
                organisation.lat = Number.parseFloat(coords[2]);
                await db.manager.save(organisation);
            });

            this.log(`Finished geocoding organisations: ${results.length} updates, ${errors.length} errors`);

            // Finish processing this task
            await this.finishDataset(dataset);
            this.finish();
    }
}