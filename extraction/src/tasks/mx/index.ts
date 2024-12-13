import MeasurementTask from '@/lib/task/MeasurementTask.jsx';
import { PromisePool } from '@supercharge/promise-pool';
import { Resolver } from 'dns/promises';
import psl from 'psl';
import { URL } from '@are-we-dependent/data';
import lookup from '@/lib/ipLookup.js';
import { CONCURRENCY } from '@/const.js';

const resolver = new Resolver();
resolver.setServers([
    '1.1.1.1'
]);

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
                    const { ip, hostname } = await this.recursivelyRetrieveDNSRecord(url.url);

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
                        url: url.url,
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

    async recursivelyRetrieveDNSRecord(url: string) {
        // Resolve the MX record
        const mxs = (await resolver.resolveMx(url))
            .sort((a, b) => a.priority - b.priority);

        // Loop through all MX records
        let fallthrough_ip: string | undefined;
        for await (const mx of mxs) {
            // Retrieve all IPs for a given record
            const ips = await resolver.resolve4(mx.exchange)
                .catch(() => []);

            if (!fallthrough_ip && ips.length) fallthrough_ip = ips[0];

            // Loop through all IPs
            for await (const ip of ips) {
                // Retrieve all hostnames for the IP
                const hostnames = await resolver.reverse(ip)
                    .catch(() => []);

                // GUARD: If a hostname was found, we can stop execution
                if (hostnames.length) {
                    return { mx, ip, hostname: hostnames[0] };
                }
            }
        }

        // GUARD: That we've arrived here means that we failed to retrieve any
        // hostnames. We'll try to at least capture an IP in that case
        if (fallthrough_ip && mxs.length) {
            return { mx: mxs[0].exchange, ip: fallthrough_ip}
        }

        // If the domain is unresolvable, throw an error for the database
        throw new Error(`Failed to retrieve MX records for domain ${url}`);
    }
}
