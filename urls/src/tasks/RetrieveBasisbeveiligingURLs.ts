import { Task } from '../lib/Task';
import { BasisBeveiligingConfig, Organization, URL } from '../lib/Basisbeveiliging';
import db from '../db';
import psl from 'psl';

/**
 * Convert a CSV-formatted JSON array (first row header, proceeding rows data)
 * into an array of objects.
 */
function parseCSVJSON<T>(input: unknown[][]): T[] {
    const headers = input.shift() as string[];

    const rows = input.map((row) => {
        return headers.reduce((obj, header, i) => {
            obj[header] = row[i];
            return obj;
        }, {}) as T;
    });

    return rows;
}

const RetrieveBasisbeveiligingURLs: Task = {
    name: 'retrieve_basisbeveiliging_urls',
    description: 'Retrieving URLs from basisbeveiliging.nl',
    async onStart({ finish, updateProgress, updateTotal }) {
        // Retrieve the available config from basisbeveiliging
        const configResponse = await fetch('https://basisbeveiliging.nl/data/config/');
        const config: BasisBeveiligingConfig = await configResponse.json();
        const layers = config.country_and_layers.NL.layers;

        // Update the progress
        updateTotal(layers.length);

        // Loop through all layers, pulling all organisations and urls in the process
        const results = await Promise.all(layers.map(async (layer) => {
            // Retrieve the organisations for this layer
            const orgRequest = await fetch(`https://basisbeveiliging.nl/data/export/organizations/NL/${layer}/json/`);
            const orgData = (await orgRequest.json()).data
            const organisations = parseCSVJSON<Organization>(orgData);

            // Insert all organisations into the database
            const insertOrg = db.prepare('INSERT OR IGNORE INTO organisations (name, source, category) VALUES (@name, \'basisbeveiliging\', @category);');
            const insertAllOrgs = db.transaction((orgs: Organization[]) => {
                for (const org of orgs) 
                    insertOrg.run({ 
                        ...org,
                        category: `bb_${layer}`
                    });
            });
            insertAllOrgs(organisations);

            // Retrieve all URLs for this layer
            const urlRequest = await fetch(`https://basisbeveiliging.nl/data/export/urls_only/NL/${layer}/json/`);
            const urlData = (await urlRequest.json()).data;
            const urls = parseCSVJSON<URL>(urlData);

            const roots = new Set<string>();

            urls.forEach((d) => {
                const root = psl.get(d.url);
                if (root) roots.add(root);
            });

            // Insert URLs into database
            const insertUrl = db.prepare('INSERT OR IGNORE INTO urls (url, category, organisation_id) VALUES (@url, @category, null);');
            const insertAllURLs = db.transaction((urls: URL[]) => {
                for (const url of roots) 
                    insertUrl.run({ 
                        url: url,
                        category: `bb_${layer}`
                    });
            });
            insertAllURLs(urls);

            // Update progress
            updateProgress((p) => p + 1);

            return [organisations.length, urls.length];
        }));

        // Calculate the total sum of organisations and URLs retrieved
        const sumResults = results.reduce((sum, subresult) => {
            subresult.forEach((subtotal, i) => {
                sum[i] += subtotal;
            });

            return sum;
        });

        finish(`Retrieved ${sumResults[0]} organisations and ${sumResults[1]} URLs`);
    },
};

export default RetrieveBasisbeveiligingURLs;