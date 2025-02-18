import { Resolver } from 'dns/promises';

export const resolver = new Resolver();
resolver.setServers([
    '1.1.1.1'
]);

export async function recursivelyRetrieveMXRecord(url: string) {
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
        return { mx: mxs[0].exchange, ip: fallthrough_ip }
    }

    // If the domain is unresolvable, throw an error for the database
    throw new Error(`Failed to retrieve MX records for domain ${url}`);
}