import { CAIDA_DB_LOCATION } from '@/const.js';
import logger from './logger.js';

export interface CaidaOrganisation {
    name: string;
    country: string;
    source: string;
}

logger.info(`Opening ASN database at ${CAIDA_DB_LOCATION}`);
const asnLookup: Record<number | string, CaidaOrganisation> = await import(CAIDA_DB_LOCATION);

/**
 * Retrieve information about an autonomous system
 */
export function getASNInfo(asn: number) {
    return asnLookup[asn];
} 

export default asnLookup;