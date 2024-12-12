import { IPINFO_DB_LOCATION, IPINFO_TOKEN } from '@/const.js';
import { getCacheKeyFromUrl } from '@/lib/cacheKey.js';
import DatasetTask from '@/lib/task/DatasetTask.js';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

const DATASET_URL = 'https://ipinfo.io/data/free/country_asn.mmdb';

export default class RetrieveIPInfoDatabase extends DatasetTask {
    name = 'ipinfo-db';
    description = 'Download the latest IP-ASN-Geolocation database from IPInfo.';
    url = `${DATASET_URL}?token=${IPINFO_TOKEN}`;

    async onStart(): Promise<void> {
        // Use that to check if we need any updates
        const { dataset, buffer } = await this.retrieveAndMatchDataset(
            this.name,
            DATASET_URL,
            () => getCacheKeyFromUrl(this.url),
        ) || {};

        // GUARD: No update necessary, keep the current database
        if (!dataset) {
            this.log('Database already up-to-date.')
            this.finish();
            return;
        } else {
            this.log('Updating database...')
        }

        // GUARD: Check if we already retrieved the data
        const dataStream = buffer
            // If so, repack it as a stream
            ? Readable.from(new Blob([ buffer ]).stream())
            // If not, retrieve the file as a stream
            : Readable.fromWeb(await this.getDatasetAsStream());

        // Create a stream that stores the database to a file
        const fileStream = createWriteStream(IPINFO_DB_LOCATION);

        // Wait for the stream to complete
        await finished(dataStream.pipe(fileStream));

        // Update the dataset to save the cache key
        await this.finishDataset(dataset);

        this.log('Database update complete.')
        this.finish();
    }

    async getDatasetAsStream() {
        const response = await fetch(this.url);

        if (!response.ok || !response.body) {
            throw new Error(`Failed to retrieve IPInfo DB: ${response.statusText}`);
        }

        return response.body;
    }
}