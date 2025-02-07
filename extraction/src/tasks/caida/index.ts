import { CAIDA_DB_LOCATION } from '@/const.js';
import { getCacheKeyFromUrl } from '@/lib/cacheKey.js';
import DatasetTask from '@/lib/task/DatasetTask.js';
import { writeFile } from 'fs/promises';

export interface CaidaOrganisation {
    name: string;
    country: string;
    source: string;
}

async function streamToString(stream: ReadableStream) {
    // lets have a ReadableStream as a stream variable
    const chunks = [];

    for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks).toString("utf-8");
}

export default class RetrieveCaidaASNDataset extends DatasetTask {
    name = 'caida';
    description = 'Retrieving the CAIDA Autonomous System Number (ASN) database';
    url = 'https://publicdata.caida.org/datasets/as-organizations/';

    async onStart() {
        const { dataset, buffer } = await this.retrieveAndMatchDataset(
            this.name,
            this.url,
            () => getCacheKeyFromUrl(this.url)
        ) || {};

        // GUARD: No update necessary, keep the current database
        if (!dataset) {
            this.log('Already up-to-date.')
            this.finish();
            return;
        } else {
            this.log('Updating database...')
        }

        // GUARD: Check if we already retrieved the data
        if (!buffer) throw new Error('Failed to retrieve CAIDA index');

        // The dataset url returns an index with all historical datasets. We'll
        // just need the last one.
        const index = new TextDecoder().decode(buffer);

        // Retrieve the URL for the latest dataset
        const latestDataset = [...index.matchAll(/\d{8}.as-org2info\.txt\.gz/g)].at(-1);
        const datasetUrl = this.url + latestDataset;

        // Retrieve that dataset
        const dataRequest = await fetch(datasetUrl);
        if (!dataRequest.body) throw new Error('Failed to retrieve CAIDA data');

        // Decompress, and parse into a string
        const data = await streamToString(dataRequest.body.pipeThrough(new DecompressionStream('gzip')));

        // Now, we'll parse the TXT file, which is setup in a kind of weird way.
        // It has relational data, which is broken up into sections in the same
        // text file. Very unfortunate, but we'll attempt our best at parsing
        // it.
        
        // We'll keep track of which section we're currently in
        let mode: 'comments' | 'organisations' | 'asns' = 'comments';

        // We'll also define the variables which will actually keep our data
        const organisations = new Map<string, CaidaOrganisation>();
        const asns: Record<number, CaidaOrganisation> = {};

        // Then, split the file into lines and loop over them, one by one.
        const lines = data.split(/\r?\n/);
        this.updateTotal(lines.length);
        lines.forEach((line, i) => {
            this.updateProgress(i);
            if (!line) {
                return;
            // GUARD: When browsing through the comments, look for the
            // organisations header 
            } else if (mode === 'comments'
                && line === "# format:org_id|changed|org_name|country|source"
            ) {
                mode = 'organisations';
                return;
            } else if (mode === 'organisations') {
                // GUARD: Always check for the asns header
                if (line === '# format:aut|changed|aut_name|org_id|opaque_id|source') {
                    mode = 'asns';
                    return;
                }

                // Parse the line according to the data format
                const [orgId, changed, name, country, source] = line.split('|');

                // Store the organisations in a map, so we can match it with an
                // ASN later
                organisations.set(orgId, { name, country, source });
            } else if (mode === 'asns')  {
                // Parse the line according to the data format
                const [aut, changed, autName, orgId, opaqueId, source] = line.split('|');

                // Retrieve the organisation from earlier
                const organisation = organisations.get(orgId);
                if (!organisation) {
                    throw new Error(`Organisation ${orgId} not found in line "${line}"`);
                }

                // Assign it to the ASN
                asns[Number.parseInt(aut)] = organisation;
            }
        });

        // Write the record to disk
        await writeFile(CAIDA_DB_LOCATION, JSON.stringify(asns));

        await this.finishDataset(dataset);
        this.finish();
    }
}