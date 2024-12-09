import { PromisePool } from '@supercharge/promise-pool'

import { Resolver } from 'dns/promises';
import { cluster, objectify, unique } from 'radash';
import IPToASN from '@/lib/IPToAsn.js';
import parseURL from '@/lib/ParseURL.js';
import MeasurementTask from '@/lib/task/MeasurementTask.jsx';

/** The number of IP addresses that are processed in one batch */
const ASN_LOOKUP_CHUNK = 2_000;

const resolver = new Resolver()
resolver.setServers([
    '8.8.8.8',
    '8.8.4.4',
]);

export default class RetrieveWebhost extends MeasurementTask {
    name = 'retrieve-webhost';
    description = 'Retrieving webhosts';

    async onStart() {
        // Retrieve all URLs and update total
        const urls = await this.getAllURLs();
        this.updateTotal(urls.length * 2);

        const { results } = await PromisePool
            .withConcurrency(25)
            .withTaskTimeout(5_000)
            .handleError((err) => console.error(err))
            .for(urls.map((u) => u.url))
            .process(async (url, index) => {
                try {
                    // Retrieve IPv4 address
                    const [ip] = await resolver.resolve4(url);
                    this.updateProgress((p) => p + 1);

                    // Return an IP to URL mapping
                    return { ip, url };
                } catch (e) {
                    this.updateProgress((p) => p + 1);
                    if (e instanceof Error) {
                        await this.insertError('webhost-as', url, e)
                    }
                }
            });

        // Mark the first round done
        this.updateProgress(urls.length);

        // Filter any IPs that were unsuccessfully retrieved
        const ips = results.filter((r) => !!r)
            // Sort them, so that overlapping IPs are more often in the same batch
            .sort((a, b) => a.ip.localeCompare(b.ip));

        // Retrieve ASNns for batches of IP addresses
        for await (const batch of cluster(ips, ASN_LOOKUP_CHUNK)) {
            // Create a list of IPs
            const ips = unique(batch.map((o) => o.ip));

            // Query the database for the AS for said batch
            const results = (await new IPToASN().query(ips))
                .filter((r) => !!r.address);
            const resultMap = objectify(results, (r) => r.address!);

            const inserts = batch.map(async ({ ip, url }) => {
                const result = resultMap[ip];
                
                try {
                    await this.insertMeasurement(
                        'webhost-as',
                        url, 
                        `${result.ASN}-${result.description}`
                    );
                    this.updateProgress((p) => p + 1);
                } catch(e) {
                    if (e instanceof Error) {
                        await this.insertError('webhost-as', url, e);
                    }
                }
            });

            await Promise.all(inserts);
        }

        this.finish();
    }
}
