import { DB_FOLDER, SOURCES_FOLDER } from '@are-we-dependent/data/src/const.js';
import path from 'path';

/** The current date as an ISO string */
export const DATE_NOW = new Date().toISOString().substring(0, 10);

/** Where the logs will be stored */
export const LOG_FOLDER = path.join(DB_FOLDER, 'logs');
/** The filename for the current log file */
export const LOG_FILENAME = 'log-' + DATE_NOW + '.log';
/** The path to the current log file */
export const LOG_PATH = path.join(LOG_FOLDER, LOG_FILENAME);

/** The IPInfo token. Used for retrieving an ASN-IP-Geolocation database. Put it
 in your .env file and it will automatically be loaded. Retrieve it from
 https://ipinfo.io/account/token. * */
export const IPINFO_TOKEN = process.env.IPINFO_TOKEN;
/** Where the database will be saved */
export const IPINFO_DB_LOCATION = path.join(SOURCES_FOLDER, 'ip-info-country-asn.mmdb');

/** The minimum amount of time that needs to pass before a new update for a
 * dataset is attempted. */
export const MINIMUM_DATASET_UPDATE_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours