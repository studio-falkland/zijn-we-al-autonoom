import { XMLParser } from 'fast-xml-parser';
import CSVTask, { BaseCSVDatasetConfig } from '@/lib/task/CSVTask.jsx';
import { RIOXML, RIORow } from './types.js';
import parseAddress from './parse.js';
import { DatasetDatum } from '@/lib/task/DatasetTask.js';
import { GovernmentSector, Region, Category } from '@are-we-dependent/data';

/**
 * Attempt to parse similar looking organisation datasets from the central government.
 */
function getRioConfig(
    name: string,
    sector: GovernmentSector,
): BaseCSVDatasetConfig<RIORow> {
    return {
        name,
        classification: {
            region: Region.Local,
            category: Category.Government,
            sector,
        },
        getOrganisation(row) {
            // GUARD: Only parse top-level organisations
            if (row.Type === 'Organisatieonderdeel') return null;

            // Attempt to parse the address data
            const addresses = parseAddress(row['Adressen (type, toelichting, straat, huisnummer, toevoeging, postbus, postcode, plaats, regio, provincieAfkorting, land, centroideLatitude, centroideLongitude, centroideRdx, centroideRdy)']);
            const visitingAddress = addresses.find((a) => a.type === 'Bezoekadres') || addresses[0];

            return {
                name: row['Officiële naam'],
                address: `${visitingAddress?.straat} ${visitingAddress?.huisnummer}`,
                city: visitingAddress?.plaats,
                postcode: visitingAddress?.postcode,
                lat: visitingAddress?.centroideLatitude
                    ? parseFloat(visitingAddress.centroideLatitude)
                    : undefined,
                lng: visitingAddress?.centroideLongitude
                    ? parseFloat(visitingAddress.centroideLongitude)
                    : undefined,
            };
        },
        getUrl(row) {
            return row['Internetpagina\'s']
                .replace(', label: algemeen', '')
                .trim();
        },
        delimiter: ';',
        headers: true,
    };
}

export default class RetrieveRijksoverheidURLs extends CSVTask {
    name = 'retrieve_rijksoverheids_urls';
    description = 'Retrieving URLs from Register Internetdomeinen Overheid';

    async onStart() {
        const csvInserts = [
            this.importCSVFromURL(
                'https://organisaties.overheid.nl/export/Gemeenten.csv',
                getRioConfig('rio-municipalities', GovernmentSector.Municipality),
            ),
            this.importCSVFromURL(
                'https://organisaties.overheid.nl/export/Provincies.csv',
                getRioConfig('rio-provinces', GovernmentSector.Province),
            ),
            this.importCSVFromURL(
                'https://organisaties.overheid.nl/export/Waterschappen.csv',
                getRioConfig('rio-water-boards', GovernmentSector.WaterBoard),
            ),
            this.importCSVFromPath<{ name: string; url: string }>('../data/sources/ministeries.csv', {
                name: 'custom-ministries',
                classification: {
                    region: Region.National,
                    category: Category.Government,
                    sector: GovernmentSector.Ministry,
                },
                getOrganisation(row) {
                    return { name: row.name };
                },
                getUrl(row) {
                    return row.url;
                },
                delimiter: ';',
            }),
        ];

        await Promise.all(csvInserts);

        // Prepare the XML dataset
        const result = await this.retrieveDatasetFromURL('rio-all', 'https://organisaties.overheid.nl/archive/exportRIO.xml');

        // GUARD: If the dataset is non-existent, it means we don't have to
        // update it
        if (!result) {
            this.finish();
            return;
        }

        // Parse data as XML
        const rootObject: RIOXML = new XMLParser()
            .parse(Buffer.from(result.data));

        const data: DatasetDatum[] = rootObject['p:RegisterInternetdomeinenOverheid']['p:organisatie'].map((o) => {
            return {
                organisation: {
                    name: o['p:naam'],
                },
                url: o['p:contact']['p:url'],
            };
        });

        this.insertOrUpdate(
            result.dataset,
            data,
            {
                region: Region.National,
                category: Category.Government,
                sector: GovernmentSector.Other,
            },
        );

        this.finish();
    }
}
