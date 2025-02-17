import { CONCURRENCY } from '@/const.js';
import asnLookup from '@/lib/asnLookup.js';
import lookup from '@/lib/ipLookup.js';
import { resolver } from '@/lib/resolver.js';
import CSVTask from '@/lib/task/CSVTask.jsx';
import db, { Aggregate } from '@are-we-dependent/data';
import { PromisePool } from '@supercharge/promise-pool';
import { parseString } from 'fast-csv';

const WEBHOST_DATASET_LOCATION = '../data/sources/SIDN-Labs/a.csv';
const MX_DATASET_LOCATION = '../data/sources/SIDN-Labs/mx_mail.csv';
const SOCIALS_DATASET_LOCATION = '../data/sources/SIDN-Labs/socials.csv';

const MX_OVERRIDES: Record<string, string | null> = {
    'rzone.de': 'smtp.rzone.de',
    'yourfilter.nl': 'primary.yourfilter.nl',
    'mb1p.com': 'dovendi.eu',
    'other': null,
};

export type QueryPartialEntity<T> = {
    [P in keyof T]?: T[P] | (() => string);
};

export interface SIDNBaseRow {
    year: string;
    month: string;
    n_domains: string;
    perc_domains: string;
}

export interface SIDNWebhostRow extends SIDNBaseRow {
    asnOwner: string;
    asn: string;
    ipv: string;
}

export interface SIDNMXRow extends SIDNBaseRow {
    mx_second_level: string;
}

export interface SIDNSocialsRow extends SIDNBaseRow {
    social: string;
}

const decoder = new TextDecoder('utf-8');

export class RetrieveSIDNLabsNLTLDData extends CSVTask {
    name = 'retrieve-dot-nl-data';
    description = 'Loading the .nl aggregate data';

    async onStart(): Promise<void> {
        await Promise.all([
            /**=================================================================
             * WEBHOSTS
             ==================================================================*/
            this.importCSVToAggregate<SIDNWebhostRow>(
                WEBHOST_DATASET_LOCATION,
                {
                    name: 'dotnl-webhost',
                    parse(row) {
                        // Retrieve organisation by ASN
                        const organisation = asnLookup[row.asn];

                        return {
                            label: row.asnOwner,
                            asn: row.asn ? Number.parseInt(row.asn) : null,
                            as_organisation: organisation?.name || row.asnOwner,
                            as_country_code: organisation?.country
                        }
                    },
                }
            ),
            /**=================================================================
             * MAIL
             ==================================================================*/
            this.importCSVToAggregate<SIDNMXRow>(
                MX_DATASET_LOCATION,
                {
                    name: 'dotnl-mx',
                    async parse(row) {
                        // Apply any MX overrides
                        const hostname = row.mx_second_level in MX_OVERRIDES
                            ? MX_OVERRIDES[row.mx_second_level]
                            : row.mx_second_level;

                        // Attempt to resolve the MX record
                        const result = hostname && await resolver.resolve4(hostname);
                        const organisation = result?.length ? lookup.get(result[0]) : null;

                        return {
                            label: row.mx_second_level,
                            asn: organisation?.asn
                                ? Number.parseInt(organisation.asn.replace(/AS/, ''))
                                : null,
                            as_organisation: organisation?.as_name,
                            as_country_code: organisation?.country
                        }
                    },
                }
            ),
            /**=================================================================
             * SOCIALS
             ==================================================================*/
            this.importCSVToAggregate<SIDNSocialsRow>(
                SOCIALS_DATASET_LOCATION,
                {
                    name: 'dotnl-socials',
                    async parse(row) {
                        return {
                            label: row.social,
                        };
                    }
                }
            )
        ]);

        this.finish();
    }

    async importCSVToAggregate<T extends SIDNBaseRow>(
        path: string,
        config: {
            name: string;
            parse: (row: T) => QueryPartialEntity<Aggregate> | Promise<QueryPartialEntity<Aggregate>>
        }
    ): Promise<void> {
        const { dataset, data: buffer } = await this.retrieveDatasetFromPath(config.name, path) || {};

        if (!dataset) {
            return;
        }

        this.log(`Parsing data from CSV for ${config.name} (${buffer?.byteLength} bytes)`);
        const rows = await new Promise<T[]>((resolve, reject) => {
            // Store a reference to the array
            const data: T[] = [];

            // Loop through all rows in the CSV
            parseString(
                decoder.decode(buffer),
                { delimiter: ',', headers: true },
            ).on('data', (row: T) => {
                // Add all rows to the data object
                data.push(row);
            }).on('error', reject)
            .on('end', () => {
                resolve(data);
            });
        });

        // Update and display the total imported rows
        this.log(`Retrieved ${rows.length} entries from CSV for ${config.name}`);
        this.updateTotal((n) => n + rows.length);

        // Loop over all rows to transform them to the right format
        const { results: data } = await PromisePool
            .withConcurrency(CONCURRENCY)
            .withTaskTimeout(5_000)
            .handleError(async (err, row) => {
                this.log('Failed to parse aggregate', { err, row, name: config.name });
            })
            .for(rows)
            .process(async (row) => {
                // Parse the object
                const datum = await config.parse(row)

                // Update the progress indicator
                this.updateProgress((n) => n + 1);

                // Add all common identifiers to the row as well
                return {
                    ...datum,
                    date: new Date(Number.parseInt(row.year), Number.parseInt(row.month)),
                    fraction: Number.parseFloat(row.perc_domains) / 100,
                    quantity: Number.parseInt(row.n_domains),
                    type: config.name,
                };
            });

        // Insert all datums
        const result = await db.transaction(async (manager) => {
            return manager.createQueryBuilder()
                .insert()
                .orIgnore()
                .into(Aggregate)
                .values(data)
                .execute()
                .catch((err) => {
                    this.log('Failed to insert data ', { err, message: err.message });
                });
        });

        // Store the finished dataset with the given cache key
        await this.finishDataset(dataset);

        this.log(`Inserted ${result?.identifiers.length} aggregates into database for ${config.name}`);
    }
}