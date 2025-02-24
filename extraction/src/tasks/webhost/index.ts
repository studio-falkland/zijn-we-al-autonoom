import { PromisePool } from '@supercharge/promise-pool';
import MeasurementTask from '@/lib/task/MeasurementTask.jsx';
import { CONCURRENCY } from '@/const.js';
import lookup, { getIPInfo } from '@/lib/ipLookup.js';
import psl from 'psl';
import { resolver } from '@/lib/resolver.js';
import { DestinationDataset } from '@are-we-dependent/data';

export default class RetrieveWebhost extends MeasurementTask {
    name = 'retrieve-webhost';
    description = 'Retrieving webhosts';

    async onStart() {
        // Retrieve all URLs and update total
        const urls = await this.getAllURLs();
        this.updateTotal(urls.length);

        await PromisePool
            .withConcurrency(CONCURRENCY)
            .withTaskTimeout(5_000)
            .handleError((err) => console.error(err))
            .for(urls.map((u) => u.url))
            .process(async (url, index) => {
                try {
                    // Retrieve IPv4 address
                    const [ip] = await resolver.resolve4(url);

                    // Retrieve the geolocation and ASN
                    const { asn, as, country } = getIPInfo(ip);

                    // Do a reverse lookup of the IP
                    const [domain_name] = await resolver.reverse(ip)
                        .catch(() => ([]));
                    const root = psl.get(domain_name);

                    // GUARD: Check that the ASN returns something
                    if (!asn) {
                        this.log('ASN lookup', lookup.get(ip))
                        throw new Error('Could not retrieve ASN');
                    }

                    await this.insertMeasurement({
                        type: DestinationDataset.WebhostingAS,
                        url,
                        data: asn.toString(),
                        asn: asn ?? undefined,
                        as_organisation: as.name,
                        country_code: country,
                        as_country_code: as.country,
                        domain_name: root || undefined,
                    });
                }
                catch (e) {
                    if (e instanceof Error) {
                        await this.insertError('webhost', url, e);
                    }
                }

                this.updateProgress((p) => p + 1);
            });

        this.finish();
    }
}
