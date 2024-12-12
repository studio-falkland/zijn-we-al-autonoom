import MeasurementTask from '@/lib/task/MeasurementTask.jsx';
import { PromisePool } from '@supercharge/promise-pool';
import { Resolver } from 'dns/promises';
import psl from 'psl';
import { URL } from '@are-we-dependent/data';

const resolver = new Resolver();
resolver.setServers([
    '8.8.8.8',
    '8.8.4.4',
]);

export default class RetrieveMX extends MeasurementTask {
    name = 'check-mx';
    description = 'Retrieving MX records';

    async handleError(err: Error, url: URL) {
        await this.insertError('mx', url.url, err);
        await this.insertError('mx-root', url.url, err);
    }

    async onStart() {
        // Retrieve all URLs in the database
        const urls = await this.getAllURLs();

        this.updateTotal(urls.length);

        await PromisePool
            .withConcurrency(5)
            .withTaskTimeout(5_000)
            .for(urls)
            .handleError(this.handleError)
            .process(async (url) => {
                try {
                    // Resolve the MX record
                    const [mx] = await resolver.resolveMx(url.url);

                    // Retrieve the IP address for the record
                    const [ip] = await resolver.resolve4(mx.exchange);

                    // Retrieve the hostname for that IP (reverse DNS lookup)
                    const [hostname] = await resolver.reverse(ip);

                    // Extract root from the hostname
                    const root = psl.get(hostname);

                    if (!root) {
                        throw new Error(`Could not resolve root from URL "${hostname}"`);
                    }

                    // Insert measurements
                    await this.insertMeasurement('mx', url.url, hostname);
                    await this.insertMeasurement('mx-root', url.url, root);
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
