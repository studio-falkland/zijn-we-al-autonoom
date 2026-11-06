import path from 'path';

/**
 * The folder containing the IPInfo MMDB and CAIDA ASN dataset. Defaults to the
 * `data/sources` folder in this repository, which works when the CLI is linked
 * with `pnpm link --global`.
 */
export const DATA_DIR = process.env.ZWAA_DATA_DIR
    ?? path.join(import.meta.dirname, '..', '..', 'data', 'sources');
