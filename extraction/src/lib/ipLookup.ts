import { IPINFO_DB_LOCATION } from '@/const.js';
import maxmind, { Reader } from 'maxmind';
import logger from './logger.js';

export interface LookupResponse {
    as_domain: string,
    as_name: string,
    asn: string,
    continent: string,
    continent_name: string,
    country: string,
    country_name: string,
}

logger.info(`Opening IP/ASN database at ${IPINFO_DB_LOCATION}`);
const lookup = await maxmind.open(IPINFO_DB_LOCATION) as Reader<LookupResponse>;

export default lookup;