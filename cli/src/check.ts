import { getIPInfo } from './lib/ipLookup.js';
import parseURL from './lib/parseURL.js';
import { recursivelyRetrieveMXRecord, resolver } from './lib/resolver.js';

export interface Provider {
    ip: string;
    asn?: number;
    organisation?: string;
    country?: string;
}

export interface WebhostingResult extends Provider {
    hostname?: string;
}

export interface EmailResult extends Provider {
    mx: string;
    hostname?: string;
}

export type CheckValue = WebhostingResult | EmailResult | { error: string };

export interface CheckResult {
    url: string;
    domain: string | null;
    redirectedTo?: string;
    webhosting?: CheckValue;
    email?: CheckValue;
}

export interface CheckOptions {
    followRedirects?: boolean;
}

/**
 * Check the webhosting and email dependence of a single URL.
 */
export async function check(url: string, options: CheckOptions = {}): Promise<CheckResult> {
    const parsedDomain = parseURL(url);

    if (!parsedDomain) {
        return { url, domain: null };
    }

    let domain = parsedDomain;
    let redirectedTo: string | undefined;

    // Follow HTTP redirects to the final domain, since many domains redirect
    // to a different canonical domain that actually hosts the website and mail.
    if (options.followRedirects !== false) {
        const finalURL = await followRedirects(url);
        const finalDomain = finalURL ? parseURL(finalURL) : null;

        if (finalDomain && finalDomain !== domain) {
            domain = finalDomain;
            redirectedTo = finalURL ?? undefined;
        }
    }

    const [webhosting, email] = await Promise.all([
        checkWebhosting(domain).catch(toError),
        checkEmail(domain).catch(toError),
    ]);

    return { url, domain, redirectedTo, webhosting, email };
}

async function followRedirects(url: string): Promise<string | null> {
    const fetchURL = /^https?:\/\//i.test(url.trim())
        ? url.trim()
        : `http://${url.trim()}`;

    try {
        const response = await fetch(fetchURL, {
            redirect: 'follow',
            signal: AbortSignal.timeout(5_000),
            headers: {
                'user-agent': 'zwaa/0.1.0',
            },
        });

        await response.body?.cancel();

        return response.url;
    } catch {
        return null;
    }
}

async function checkWebhosting(domain: string): Promise<WebhostingResult> {
    // Retrieve IPv4 address
    const [ip] = await resolver.resolve4(domain);
    if (!ip) throw new Error('No IPv4 address found');

    // Do a reverse lookup of the IP
    const [hostname] = await resolver.reverse(ip)
        .catch(() => []);

    const info = await getIPInfo(ip);

    return {
        ip,
        hostname,
        asn: info.asn,
        organisation: info.as?.name ?? info.as_name,
        country: info.as?.country ?? info.country,
    };
}

async function checkEmail(domain: string): Promise<EmailResult> {
    const { mx, ip, hostname } = await recursivelyRetrieveMXRecord(domain);
    const info = await getIPInfo(ip);

    return {
        mx: mx.exchange,
        ip,
        hostname,
        asn: info.asn,
        organisation: info.as?.name ?? info.as_name,
        country: info.as?.country ?? info.country,
    };
}

function toError(error: unknown): { error: string } {
    return { error: error instanceof Error ? error.message : String(error) };
}
