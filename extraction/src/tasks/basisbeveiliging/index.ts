import { BasisBeveiligingConfig } from './types.js';
import DatasetTask from '@/lib/task/DatasetTask.js';

/**
 * We retain organisations from other datasets. Since we attempt to collect a
 * single URL from a single organisations, we prefer these datasets over the
 * basisbeveiliging dataset. Hence, we'll filter them here.
 */
const LAYER_BLACKLIST = new Set([
    'municipality',
    // "cyber",
    // "healthcare",
    'province',
    'waterschappen',
    'safety_region',
    // "political_parties",
    'government',
    'education_university',
    'education_hbo',
    'education_junior_college',
    'education_secondary_education',
    'education_primary_education',
    'central_government_general_affairs',
    'central_government_interior_relations',
    'central_government_foreign_affairs',
    'central_government_defense',
    'central_government_economy',
    'central_government_finance',
    'central_government_infrastructure',
    'central_government_justice',
    'central_government_agriculture',
    'central_government_education',
    'central_government_employment',
    'central_government_health',
    'zelfstandige-bestuursorganen',
    'adviescolleges',
    'agentschappen',
    'openbare-lichamen-voor-beroep-en-bedrijf',
    'koepelorganisaties',
    'saba',
    'st_eustatius',
    'bonaire',
    // "healthcare_hospital",
    // "healthcare_ggd",
    // "healthcare_ggz",
    // "vital_energy",
    // "vital_finance_bank_deposit_guarantee",
    // "vital_finance_payment_processing",
    // "vital_finance_bank_eer_dutch_market"
]);

export default class RetrieveBasisbeveiligingURLs extends DatasetTask {
    name = 'retrieve_basisbeveiliging_urls';
    description = 'Retrieving URLs from basisbeveiliging.nl';

    async onStart() {
        // Retrieve the available config from basisbeveiliging
        const configResponse = await fetch('https://basisbeveiliging.nl/data/config/');
        const config = await configResponse.json() as BasisBeveiligingConfig;
        const layers = config.country_and_layers.NL.layers
            .filter((layer) => !LAYER_BLACKLIST.has(layer));

        // const inserts = layers.map((layer) => {
        //     this.
        // });

        // Loop through all layers, pulling all organisations and urls in the process
        // const results = await Promise.all(layers.map(async (layer) => {
        //     // Retrieve the organisations for this layer
        //     const orgRequest = await fetch(`https://basisbeveiliging.nl/data/export/organizations/NL/${layer}/json/`);
        //     const orgData = (await orgRequest.json()).data
        //     const organisations = parseCSVJSON<Organization>(orgData);

        //     // Insert all organisations into the database
        //     const insertAllOrgs = db.transaction((orgs: Organization[]) => {
        //         for (const org of orgs)
        //             insertOrganisation.run({
        //                 ...org,
        //                 source: 'basisbeveiliging',
        //                 category: `bb_${layer}`
        //             });
        //     });
        //     insertAllOrgs(organisations);

        //     // Retrieve all URLs for this layer
        //     const urlRequest = await fetch(`https://basisbeveiliging.nl/data/export/urls_only/NL/${layer}/json/`);
        //     const urlData = (await urlRequest.json()).data;
        //     const urls = parseCSVJSON<URL>(urlData);

        //     const roots = new Set<string>();

        //     urls.forEach((d) => {
        //         const root = psl.get(d.url);
        //         if (root) roots.add(root);
        //     });

        //     // Insert URLs into database
        //     const insertAllURLs = db.transaction((urls: URL[]) => {
        //         for (const url of roots)
        //             insertUrl.run({
        //                 url: url,
        //                 category: `bb_${layer}`,
        //                 organisation_id: null,
        //             });
        //     });
        //     insertAllURLs(urls);

        //     // Update progress
        //     updateProgress((p) => p + 1);

        //     return [organisations.length, urls.length];
        // }));

        // // Calculate the total sum of organisations and URLs retrieved
        // const sumResults = results.reduce((sum, subresult) => {
        //     subresult.forEach((subtotal, i) => {
        //         sum[i] += subtotal;
        //     });

        //     return sum;
        // });

        // finish(`Retrieved ${sumResults[0]} organisations and ${sumResults[1]} URLs`);
    }
}
