import type { MxRecord } from 'dns';
import { Resolver } from 'dns/promises';

export const resolver = new Resolver();
resolver.setServers([
    '1.1.1.1'
]);

export interface MXResolution {
    mx: MxRecord;
    ip: string;
    hostname?: string;
}

/**
 * Resolve the MX records for a domain and return the first one that resolves to
 * an IP address, preferring records that also have a reverse DNS hostname.
 */
export async function recursivelyRetrieveMXRecord(domain: string): Promise<MXResolution> {
    // Resolve the MX record
    const mxs = (await resolver.resolveMx(domain))
        .sort((a, b) => a.priority - b.priority);

    // Loop through all MX records
    let fallthrough: MXResolution | undefined;
    for (const mx of mxs) {
        // Retrieve all IPs for a given record
        const ips = await resolver.resolve4(mx.exchange)
            .catch(() => []);

        if (!fallthrough && ips.length) {
            fallthrough = { mx, ip: ips[0] };
        }

        // Loop through all IPs
        for (const ip of ips) {
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
    if (fallthrough) {
        return fallthrough;
    }

    throw new Error(`No MX records found for ${domain}`);
}
