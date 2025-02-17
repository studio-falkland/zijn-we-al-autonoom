import { CAIDA_DB_LOCATION } from '@/const.js';
import logger from './logger.js';

export interface CaidaOrganisation {
    name: string;
    country: string;
    source: string;
}

logger.info(`Opening ASN database at ${CAIDA_DB_LOCATION}`);
const asnLookup: Record<number | string, CaidaOrganisation> = await import(CAIDA_DB_LOCATION);

export default asnLookup;