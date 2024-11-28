import { parseString } from '@fast-csv/parse';
import db from '../db';
import { Task } from '../lib/Task';
import { XMLParser } from 'fast-xml-parser';
import parseURL from '../lib/ParseURL';

const CSV_DATASETS = [
    { name: 'gemeenten', url: 'https://organisaties.overheid.nl/export/Gemeenten.csv' },
    { name: 'provincies', url: 'https://organisaties.overheid.nl/export/Provincies.csv' },
    { name: 'waterschappen', url: 'https://organisaties.overheid.nl/export/Waterschappen.csv' },
]

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
        const response = await fetch('https://organisaties.overheid.nl/archive/exportRIO.xml')

        if (!response.ok) {
            throw new Error('Failed to retrieve RIO dataset');
        }

        const xml = await response.text();
        const data: RIOXML = new XMLParser().parse(xml);

        updateTotal(data['p:RegisterInternetdomeinenOverheid']['p:organisatie'].length);

        const insertOrg = db.prepare('INSERT OR IGNORE INTO organisations (name, source, category) VALUES (@name, \'rio\', @category);');
        const insertUrl = db.prepare('INSERT OR IGNORE INTO urls (url, category, organisation_id) VALUES (@url, @category, null);');

        const insertAllRIO = db.transaction((organisations: RIOXML['p:RegisterInternetdomeinenOverheid']['p:organisatie']) => {
            for (let organisation of organisations) {
                const category = Array.isArray(organisation['p:types']['p:type'])
                    ? organisation['p:types']['p:type'][0]
                    : organisation['p:types']['p:type'];
                const url = parseURL(organisation['p:contact']['p:url']);

                if (!organisation['p:contact']['p:url'] || !url) {
                    continue;
                }

                insertOrg.run({
                    name: organisation['p:naam'],
                    source: 'rio',
                    category,
                });

                insertUrl.run({
                    url,
                    category: `rio-${category.toLowerCase()}`
                })

                updateProgress((p) => p + 1);
            }
        });

        insertAllRIO(data['p:RegisterInternetdomeinenOverheid']['p:organisatie']);


        await Promise.all(CSV_DATASETS.map(async (dataset) => {
            const request = await fetch(dataset.url);
            if (!request.ok)  throw new Error(`Failed to retrieve dataset "${dataset.name}"`);
            const text = await request.text();
            
            await new Promise<void>((resolve, reject) => {
                parseString(text, { headers: true, delimiter: ';' })
                    .on('data', (row: RIORow) => {
                        const url = parseURL(row['Internetpagina\'s']
                            .replace(', label: algemeen', '')
                            .trim());
                        if (row.Type === 'Organisatieonderdeel' || !url) return;

                        insertOrg.run({
                            name: row['Officiële naam'].trim(),
                            source: 'rio',
                            category: `rio-${dataset.name}`,
                        })
                        insertUrl.run({
                            url,
                            category: `rio-${dataset.name}`,
                        })
                    })
                    .on('error', () => {
                        updateTotal((n) => n + 1)
                        resolve();
                    })
                    .on('end', resolve)
            })
        }));

        // Ministerie van Algemene Zaken
        insertUrl.run({ url: "minaz.nl", category: 'rio-ministeries' });
        // Ministerie van Asiel en Migratie
        // insertUrl.run({ url: "minaz.nl", category: 'rio-ministeries' });
        // Ministerie van Binnenlandse Zaken en Koninkrijksrelaties
        insertUrl.run({ url: "minbzk.nl", category: 'rio-ministeries' });
        // Ministerie van Buitenlandse Zaken
        insertUrl.run({ url: "minbuza.nl", category: 'rio-ministeries' });
        // Ministerie van Defensie
        insertUrl.run({ url: "mindef.nl", category: 'rio-ministeries' });
        // Ministerie van Economische Zaken
        insertUrl.run({ url: "minezk.nl", category: 'rio-ministeries' });
        // Ministerie van Financiën
        insertUrl.run({ url: "minfin.nl", category: 'rio-ministeries' });
        // Ministerie van Infrastructuur en Waterstaat
        insertUrl.run({ url: "minienw.nl", category: 'rio-ministeries' });
        // Ministerie van Justitie en Veiligheid
        insertUrl.run({ url: "minjenv.nl", category: 'rio-ministeries' });
        // Ministerie van Klimaat en Groene Groei
        // insertUrl.run({ url: "minaz.nl", category: 'rio-ministeries' });
        // Ministerie van Landbouw, Visserij, Voedselzekerheid en Natuur
        insertUrl.run({ url: "minlnv.nl", category: 'rio-ministeries' });
        // Ministerie van Onderwijs, Cultuur en Wetenschap
        insertUrl.run({ url: "minocw.nl", category: 'rio-ministeries' });
        // Ministerie van Sociale Zaken en Werkgelegenheid
        insertUrl.run({ url: "minszw.nl", category: 'rio-ministeries' });
        // Ministerie van Volksgezondheid, Welzijn en Sport
        insertUrl.run({ url: "minvws.nl", category: 'rio-ministeries' });
        // Ministerie van Volkshuisvesting en Ruimtelijke Ordening
        // insertUrl.run({ url: "minaz.nl", category: 'rio-ministeries' });
        
        finish();
    },
}

export default RetrieveRijksoverheidURLs;
