import { Dataset } from '@are-we-dependent/data';
import { DatasetDatum, MinimumClassification, MinimumOrganisation } from './DatasetTask.js';
import { RemoteDatasetTask } from './RemoteDatasetTask.js';
import { parseString } from 'fast-csv';

export interface BaseCSVDatasetConfig<T> {
    name: string;
    classification: MinimumClassification;
    getUrl: (row: T) => string | null;
    getOrganisation: (row: T) => MinimumOrganisation | null;
    delimiter?: string;
    headers?: boolean;
}

const decoder = new TextDecoder('utf-8');

export default class CSVTask extends RemoteDatasetTask {
    /**
     * Import a CSV dataset from a remote URL, parse it according to the config,
     * and insert and resulting organisations and URLs into the database.
     */
    public async importCSVFromURL<T>(
        url: string,
        config: BaseCSVDatasetConfig<T>,
    ) {
        const result = await this.retrieveDatasetFromURL(config.name, url);
        return this.importCSV(result?.dataset, result?.data, config);
    }

    /**
     * Import a CSV dataset from a file, parse it according to the config,
     * and insert and resulting organisations and URLs into the database.
     */
    public async importCSVFromPath<T>(
        path: string,
        config: BaseCSVDatasetConfig<T>,
    ) {
        const result = await this.retrieveDatasetFromPath(config.name, path);
        return this.importCSV(result?.dataset, result?.data, config);
    }

    async importCSV<T>(
        dataset: Dataset | undefined,
        buffer: ArrayBuffer | undefined,
        {
            headers, classification, getOrganisation, getUrl, name, delimiter,
        }: BaseCSVDatasetConfig<T>,
    ) {
        // GUARD: Check that the dataset isn't updated already
        if (!dataset || !buffer) {
            return;
        }

        // Extract all data from the CSV
        this.log('Parsing data from CSV');
        const data = await new Promise<DatasetDatum[]>((resolve, reject) => {
            // Store a reference to the array
            const data: DatasetDatum[] = [];

            // Loop through all rows in the CSV
            parseString(
                decoder.decode(buffer),
                { delimiter: delimiter || ',', headers: headers || true },
            ).on('data', (row: T) => {
                // Retrieve the organiation and URL from the row using the
                // accessors that are provided in the config
                const organisation = getOrganisation(row);
                const url = getUrl(row);

                if (!organisation) {
                    return;
                }

                // Save a reference to the data
                data.push({ organisation, url });

                // Update the total of the task
                this.updateTotal((n) => n + 1);
            }).on('error', reject)
                .on('end', () => {
                    resolve(data);
                });
        });

        this.log(`Retrieved ${data.length} entries from CSV`);

        await this.insertOrUpdate(
            dataset,
            data,
            classification,
        );
    }
}
