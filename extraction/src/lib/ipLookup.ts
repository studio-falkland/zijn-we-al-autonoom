import { IPINFO_DB_LOCATION } from '@/const.js';
import maxmind, { Reader } from 'maxmind';
import logger from './logger.js';
import { CaidaOrganisation, getASNInfo } from './asnLookup.js';

export interface BaseIPLookupResponse {
    as_domain: string,
    as_name: string,
    asn: string,
    continent: string,
    continent_name: string,
    country: string,
    country_name: string,
}

export type ModifiedIPLookupResponse = Omit<BaseIPLookupResponse, 'asn'> & {
    asn: number,
    as: CaidaOrganisation,
}

logger.info(`Opening IP/ASN database at ${IPINFO_DB_LOCATION}`);
const ipLookup = await maxmind.open(IPINFO_DB_LOCATION) as Reader<BaseIPLookupResponse>;

/**
 * Retrieve extra information about the IP address.
 */
export function getIPInfo(ip: string): ModifiedIPLookupResponse | Record<string, never> {
    // Retrieve the result from the database
    const result = ipLookup.get(ip);

    // Dont modify it further if there's no result
    if (!result) return {};

    // Parse the ASN (IPInfo includes "AS" as a first part of the string)
    const asn = Number.parseInt(result.asn.replace(/AS/, ''));

    // Retrieve extra info about the AS
    const as = getASNInfo(asn);

    return {
        ...result,
        as,
        asn,
    };
}

export default ipLookup;