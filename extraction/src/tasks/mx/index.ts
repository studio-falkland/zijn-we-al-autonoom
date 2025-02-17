import MeasurementTask from '@/lib/task/MeasurementTask.jsx';
import { PromisePool } from '@supercharge/promise-pool';
import psl from 'psl';
import { URL } from '@are-we-dependent/data';
import lookup from '@/lib/ipLookup.js';
import { CONCURRENCY } from '@/const.js';
import { recursivelyRetrieveMXRecord } from '@/lib/resolver.js';

export default class RetrieveMX extends MeasurementTask {
    name = 'check-mx';
    description = 'Retrieving MX records';

    handleError = async (err: Error, url: URL) => {
        await this.insertError('mx', url.url, err);
    }

    async onStart() {
        // Retrieve all URLs in the database
        const urls = await this.getAllURLs();

        this.updateTotal(urls.length);

        await PromisePool
            .withConcurrency(CONCURRENCY)
            .withTaskTimeout(5_000)
            .for(urls)
            .handleError(this.handleError)
            .process(async (url) => {
                try {
                    const { ip, hostname } = await recursivelyRetrieveMXRecord(url.url);

                    // Retrieve the AS and country info for the IP
                    const { asn, as_name, country } = lookup.get(ip) || {};

                    // Extract root from the hostname
                    const root = hostname ? psl.get(hostname) : null;

                    if (!root) {
                        throw new Error(`Could not resolve root from URL "${hostname}"`);
                    }

                    // Insert measurements
                    await this.insertMeasurement({
                        type: 'mx',
                        url,
                        domain_name: root,
                        ip,
                        data: root,
                        asn: asn ? Number.parseInt(asn.replace(/AS/, '')) : undefined,
                        as_organisation: as_name,
                        country_code: country,
                    });
                }
                catch (e) {
                    if (e instanceof Error) {
                        this.handleError(e, url);
                    }
                }

                this.updateProgress((p) => p + 1);
            });

        this.finish();
    }
}
