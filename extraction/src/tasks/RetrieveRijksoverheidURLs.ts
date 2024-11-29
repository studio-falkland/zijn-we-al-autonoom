import { parseString } from '@fast-csv/parse';
import db, { insertOrganisation, insertUrl } from '../db';
import { Task } from '../lib/Task';
import { XMLParser } from 'fast-xml-parser';
import parseURL from '../lib/ParseURL';

/**
 * These are the individual CSV datasets that are published as part of the
 * Register Internetdomeinen Overheid. We'll download and parse them separately.
 */
const CSV_DATASETS = [
    { name: 'gemeenten', url: 'https://organisaties.overheid.nl/export/Gemeenten.csv' },
    { name: 'provincies', url: 'https://organisaties.overheid.nl/export/Provincies.csv' },
    { name: 'waterschappen', url: 'https://organisaties.overheid.nl/export/Waterschappen.csv' },
];

interface RIOXML {
    '?xml': string;
    'p:RegisterInternetdomeinenOverheid': {
        'p:organisatie': {
            'p:naam': string;
            'p:afkorting': string;
            'p:types': { 'p:type': string | string[]; }
            'p:overzichtURL': string;
            'p:contact': {
              'p:telefoon': string;
              'p:emailadres': string;
              'p:url': string;
            },
            'p:domeinnaamregistraties': { 'p:domeinnaamregistratie': [Object] },
            'p:domeinen': { 'p:domein': [Object] }
        }[]
    }
}

interface RIORow {
    "Officiële naam": string;
    "Alternatieve naam": string;
    "Afkorting": string;
    "Type": string;
    "Subtype": string;
    "Startdatum": string;
    "Einddatum": string;
    "Datum ter verificatie": string;
    "Laatste mutatie": string;
    "Classificaties": string;
    "Onderdeel van": string;
    "Organisatiebeschrijving/doel": string;
    "Link naar uitgebreidere organisatiebeschrijving": string;
    "Adressen (type, toelichting, straat, huisnummer, toevoeging, postbus, postcode, plaats, regio, provincieAfkorting, land, : string;centroideLatitude, centroideLongitude, centroideRdx, centroideRdy)"
    "Online afspraak url": string;
    "Afspraak per email": string;
    "Telefonische afspraak": string;
    "Telefoonnummers ": string;
    "Fax": string;
    "E-mail adressen": string;
    "Internetpagina's": string;
    "Sociale Media": string;
    "Contactpagina's": string;
    "Beschrijving contactgegevens": string;
    "Relatie met ministerie": string;
    "Link naar organogram": string;
    "Oppervlakte (km2)": string;
    "Wateroppervlakte (km2)": string;
    "Bevat plaatsen": string;
    "Aantal inwoners": string;
    "Inwoners per km2": string;
    "Totaal aantal zetels": string;
    "Raad (Partij (aantal zetels))": string;
    "Beleidsterreinen": string;
    "Datum van publiceren begroting": string;
    "Actieve afwijkingen van de Regeling": string;
    "OWMS URI": string;
    "TOOi URI": string;
    "KVK-nummer": string;
    "btw-nummer": string;
    "Loonheffingennummer": string;
    "OIN": string;
    "Organisatiecode": string;
    "Actieve beheerder ROO": string;
}

const RetrieveRijksoverheidURLs: Task = {
    name: 'retrieve_rijksoverheids_urls',
    description: 'Retrieving URLs from Register Internetdomeinen Overheid',
    async onStart({ finish, updateProgress, updateTotal }) {
        // Retrieve the full RIO dataset
        const response = await fetch('https://organisaties.overheid.nl/archive/exportRIO.xml')

        // GUARD: Check if we're able to retrieve the dataset
        // (it returns a 404 sometimes)
        if (!response.ok) {
            throw new Error('Failed to retrieve RIO dataset');
        }

        // Parse the resulting data as XML
        const xml = await response.text();
        const data: RIOXML = new XMLParser().parse(xml);

        // Update the total with the number of rows in the dataset
        updateTotal(data['p:RegisterInternetdomeinenOverheid']['p:organisatie'].length);

        // Specify the process for inserting a URL originating from RIO
        const insertAllRIO = db.transaction((organisations: RIOXML['p:RegisterInternetdomeinenOverheid']['p:organisatie']) => {
            // Loop through all organisations
            for (let organisation of organisations) {
                // Retrieve the category. If there are multiple, retrieve the first
                const category = Array.isArray(organisation['p:types']['p:type'])
                    ? organisation['p:types']['p:type'][0]
                    : organisation['p:types']['p:type'];

                // Parse the URL and check it's a valid URL
                const url = parseURL(organisation['p:contact']['p:url']);
                if (!url) continue;

                // Insert the organisation
                const result = insertOrganisation.run({
                    name: organisation['p:naam'],
                    source: 'rio',
                    category,
                });

                // Insert the URL
                insertUrl.run({
                    url,
                    category: `rio-${category.toLowerCase()}`,
                    organisation_id: result.lastInsertRowid,
                })

                // Update progress
                updateProgress((p) => p + 1);
            }
        });

        // Insert all the RIO rows using the transaction
        insertAllRIO(data['p:RegisterInternetdomeinenOverheid']['p:organisatie']);

        // Loop through all individual CSV datasets
        await Promise.all(CSV_DATASETS.map(async (dataset) => {
            // Retrieve the dataset
            const request = await fetch(dataset.url);
            if (!request.ok)  throw new Error(`Failed to retrieve dataset "${dataset.name}"`);

            // Parse the dataset as text
            const text = await request.text();
            
            // Wrap the CSV parser in a promise
            await new Promise<void>((resolve, reject) => {
                // Parse the CSV string
                parseString(text, { headers: true, delimiter: ';' })
                    .on('data', (row: RIORow) => {
                        // Parse the URL
                        const url = parseURL(
                            row['Internetpagina\'s']
                                .replace(', label: algemeen', '')
                                .trim()
                        );
                        
                        // GUARD: Check that the URL is valid. Also, only
                        // process top-level entities in the dataset
                        if (row.Type === 'Organisatieonderdeel' || !url) return;

                        // Insert organisations
                        const result = insertOrganisation.run({
                            name: row['Officiële naam'].trim(),
                            source: 'rio',
                            category: `rio-${dataset.name}`,
                        })

                        // Insert URL
                        insertUrl.run({
                            url,
                            category: `rio-${dataset.name}`,
                            organisation_id: result.lastInsertRowid,
                        })
                    })
                    .on('error', reject)
                    .on('end', resolve)
            })
        }));

        // Ministerie van Algemene Zaken
        let result = insertOrganisation.run({ name: 'Ministerie van Algemene Zaken', category: 'rio-ministeries', source: 'rio'})
        insertUrl.run({ url: "minaz.nl", category: 'rio-ministeries', organisation_id: result.lastInsertRowid });
        // Ministerie van Asiel en Migratie
        result = insertOrganisation.run({ name: 'Ministerie van Asiel en Migratie', category: 'rio-ministeries', source: 'rio'})
        // EMPTY
        // Ministerie van Binnenlandse Zaken en Koninkrijksrelaties
        result = insertOrganisation.run({ name: 'Ministerie van Binnenlandse Zaken en Koninkrijksrelaties', category: 'rio-ministeries', source: 'rio'})
        insertUrl.run({ url: "minbzk.nl", category: 'rio-ministeries', organisation_id: result.lastInsertRowid });
        // Ministerie van Buitenlandse Zaken
        result = insertOrganisation.run({ name: 'Ministerie van Buitenlandse Zaken', category: 'rio-ministeries', source: 'rio'})
        insertUrl.run({ url: "minbuza.nl", category: 'rio-ministeries', organisation_id: result.lastInsertRowid });
        // Ministerie van Defensie
        result = insertOrganisation.run({ name: 'Ministerie van Defensie', category: 'rio-ministeries', source: 'rio'})
        insertUrl.run({ url: "mindef.nl", category: 'rio-ministeries', organisation_id: result.lastInsertRowid });
        // Ministerie van Economische Zaken
        result = insertOrganisation.run({ name: 'Ministerie van Economische Zaken', category: 'rio-ministeries', source: 'rio'})
        insertUrl.run({ url: "minezk.nl", category: 'rio-ministeries', organisation_id: result.lastInsertRowid });
        // Ministerie van Financiën
        result = insertOrganisation.run({ name: 'Ministerie van Financiën', category: 'rio-ministeries', source: 'rio'})
        insertUrl.run({ url: "minfin.nl", category: 'rio-ministeries', organisation_id: result.lastInsertRowid });
        // Ministerie van Infrastructuur en Waterstaat
        result = insertOrganisation.run({ name: 'Ministerie van Infrastructuur en Waterstaat', category: 'rio-ministeries', source: 'rio'})
        insertUrl.run({ url: "minienw.nl", category: 'rio-ministeries', organisation_id: result.lastInsertRowid });
        // Ministerie van Justitie en Veiligheid
        result = insertOrganisation.run({ name: 'Ministerie van Justitie en Veiligheid', category: 'rio-ministeries', source: 'rio'})
        insertUrl.run({ url: "minjenv.nl", category: 'rio-ministeries', organisation_id: result.lastInsertRowid });
        // Ministerie van Klimaat en Groene Groei
        result = insertOrganisation.run({ name: 'Ministerie van Klimaat en Groene Groei', category: 'rio-ministeries', source: 'rio'})
        // EMPTY
        // Ministerie van Landbouw, Visserij, Voedselzekerheid en Natuur
        result = insertOrganisation.run({ name: 'Ministerie van Landbouw, Visserij, Voedselzekerheid en Natuur', category: 'rio-ministeries', source: 'rio'})
        insertUrl.run({ url: "minlnv.nl", category: 'rio-ministeries', organisation_id: result.lastInsertRowid });
        // Ministerie van Onderwijs, Cultuur en Wetenschap
        result = insertOrganisation.run({ name: 'Ministerie van Onderwijs, Cultuur en Wetenschap', category: 'rio-ministeries', source: 'rio'})
        insertUrl.run({ url: "minocw.nl", category: 'rio-ministeries', organisation_id: result.lastInsertRowid });
        // Ministerie van Sociale Zaken en Werkgelegenheid
        result = insertOrganisation.run({ name: 'Ministerie van Sociale Zaken en Werkgelegenheid', category: 'rio-ministeries', source: 'rio'})
        insertUrl.run({ url: "minszw.nl", category: 'rio-ministeries', organisation_id: result.lastInsertRowid });
        // Ministerie van Volksgezondheid, Welzijn en Sport
        result = insertOrganisation.run({ name: 'Ministerie van Volksgezondheid, Welzijn en Sport', category: 'rio-ministeries', source: 'rio'})
        insertUrl.run({ url: "minvws.nl", category: 'rio-ministeries', organisation_id: result.lastInsertRowid });
        // Ministerie van Volkshuisvesting en Ruimtelijke Ordening
        result = insertOrganisation.run({ name: 'Ministerie van Volkshuisvesting en Ruimtelijke Ordening', category: 'rio-ministeries', source: 'rio'})
        // EMPTY
        
        finish();
    },
}

export default RetrieveRijksoverheidURLs;
