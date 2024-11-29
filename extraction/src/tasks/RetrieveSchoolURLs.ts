import { parseString } from '@fast-csv/parse';
import { Task } from '../lib/Task';
import db, { insertOrganisation, insertUrl } from '../db';
import parseURL from '../lib/ParseURL';

interface DUORow {
    'PROVINCIE': string;
    'BEVOEGD GEZAG NUMMER': string;
    'INSTELLINGSCODE': string;
    'INSTELLINGSNAAM': string;
    'STRAATNAAM': string;
    'HUISNUMMER-TOEVOEGING': string;
    'POSTCODE': string;
    'PLAATSNAAM': string;
    'GEMEENTENUMMER': string;
    'GEMEENTENAAM': string;
    'DENOMINATIE': string;
    'TELEFOONNUMMER': string;
    'INTERNETADRES': string;
    'ONDERWIJSSTRUCTUUR': string;
    'STRAATNAAM CORRESPONDENTIEADRES': string;
    'HUISNUMMER-TOEVOEGING CORRESPONDENTIEADRES': string;
    'POSTCODE CORRESPONDENTIEADRES': string;
    'PLAATSNAAM CORRESPONDENTIEADRES': string;
    'NODAAL GEBIED CODE': string;
    'NODAAL GEBIED NAAM': string;
    'RPA-GEBIED CODE': string;
    'RPA-GEBIED NAAM': string;
    'WGR-GEBIED CODE': string;
    'WGR-GEBIED NAAM': string;
    'COROPGEBIED CODE': string;
    'COROPGEBIED NAAM': string;
    'ONDERWIJSGEBIED CODE': string;
    'ONDERWIJSGEBIED NAAM': string;
    'RMC-REGIO CODE': string;
    'RMC-REGIO NAAM': string;
}

/**
 * These are the individual datasets that contain the schools.
 */
const DATASETS = [
    { name: 'basisonderwijs', url: 'https://duo.nl/open_onderwijsdata/images/01.-hoofdvestigingen-basisonderwijs.csv',},
    { name: 'voortgezet-onderwijs', url: 'https://duo.nl/open_onderwijsdata/images/01.-hoofdvestigingen-vo.csv',},
    { name: 'mbo', url: 'https://duo.nl/open_onderwijsdata/images/01.-adressen-mbo-instellingen.csv',},
    { name: 'hbo-wo', url: 'https://duo.nl/open_onderwijsdata/images/01.-instellingen-hbo-en-wo.csv',},
    { name: 'onderwijs-caribisch', url: 'https://duo.nl/open_onderwijsdata/images/adressen-vestigingen-caribisch-nederland.csv',},
];

const RetrieveSchoolURLs: Task = {
    name: 'retrieve-school-urls',
    description: 'Retrieve school URLs from DUO dataset',
    async onStart({ finish, updateProgress, updateTotal }) {
        updateTotal(DATASETS.length);

        await Promise.all(DATASETS.map(async (dataset) => {
            // Retrieve and verify dataset
            const request = await fetch(dataset.url);
            if (!request.ok)  throw new Error(`Failed to retrieve dataset "${dataset.name}"`);

            // Convert data to string
            const text = await request.text();
            
            await new Promise<void>((resolve, reject) => {
                parseString(text, { headers: true, delimiter: ';' })
                    .on('data', (row: DUORow) => {
                        // GUARD: Attempt to parse the URL
                        const url = parseURL(row.INTERNETADRES)
                        if (!url) return;

                        insertOrganisation.run({
                            name: row.INSTELLINGSNAAM,
                            source: 'duo',
                            category: `duo-${dataset.name}`,
                        })
                        insertUrl.run({
                            url,
                            category: `duo-${dataset.name}`,
                        })
                    })
                    .on('error', () => {
                        updateTotal((n) => n + 1)
                        resolve();
                    })
                    .on('end', resolve)
            })
        }));

        finish();
    },
};

export default RetrieveSchoolURLs;