import { readFile } from 'fs/promises';
import path from 'path';
import { DATA_DIR } from '../const.js';

export interface CaidaOrganisation {
    name: string;
    country: string;
    source: string;
}

const CAIDA_DB_LOCATION = path.join(DATA_DIR, 'caida-asn-org.json');

let asnLookup: Record<string, CaidaOrganisation> | undefined;

/**
 * Retrieve information about an autonomous system from the CAIDA dataset.
 */
export async function getASNInfo(asn: number): Promise<CaidaOrganisation | undefined> {
    if (!asnLookup) {
        try {
            asnLookup = JSON.parse(await readFile(CAIDA_DB_LOCATION, 'utf8'));
        } catch {
            throw new Error(`Could not open ASN database at ${CAIDA_DB_LOCATION}. Run \`pnpm extract\` or set ZWAA_DATA_DIR.`);
        }
    }

    return asnLookup![asn];
}
