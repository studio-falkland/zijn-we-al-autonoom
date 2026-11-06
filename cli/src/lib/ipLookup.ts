import maxmind, { Reader, Response } from 'maxmind';
import path from 'path';
import { DATA_DIR } from '../const.js';
import { CaidaOrganisation, getASNInfo } from './asnLookup.js';

export interface BaseIPLookupResponse {
    as_domain: string;
    as_name: string;
    asn: string;
    continent: string;
    continent_name: string;
    country: string;
    country_name: string;
}

export type ModifiedIPLookupResponse = Omit<BaseIPLookupResponse, 'asn'> & {
    asn: number;
    as?: CaidaOrganisation;
};

const IPINFO_DB_LOCATION = path.join(DATA_DIR, 'ip-info-country-asn.mmdb');

let ipLookup: Reader<Response> | undefined;

async function getReader() {
    if (!ipLookup) {
        try {
            ipLookup = await maxmind.open(IPINFO_DB_LOCATION);
        } catch {
            throw new Error(`Could not open IP database at ${IPINFO_DB_LOCATION}. Run \`pnpm extract\` or set ZWAA_DATA_DIR.`);
        }
    }

    return ipLookup;
}

/**
 * Retrieve extra information about an IP address.
 */
export async function getIPInfo(ip: string): Promise<Partial<ModifiedIPLookupResponse>> {
    // Retrieve the result from the database
    const reader = await getReader();
    const result = reader.get(ip) as unknown as BaseIPLookupResponse | null;

    // Dont modify it further if there's no result
    if (!result) return {};

    // Parse the ASN (IPInfo includes "AS" as a first part of the string)
    const asn = Number.parseInt(result.asn.replace(/AS/, ''));

    // Retrieve extra info about the AS
    const as = await getASNInfo(asn);

    return {
        ...result,
        as,
        asn,
    };
}
