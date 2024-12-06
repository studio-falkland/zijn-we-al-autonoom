import CSVTask, { BaseCSVDatasetConfig } from '@/lib/task/CSVTask.jsx';
import { EducationSector, OrganisationCategory, Region } from '@/hierarchy.js';
import { DUORow } from './types.js';

function getDuoConfig(
    name: string,
    sector: EducationSector
): BaseCSVDatasetConfig<DUORow> {
    return {
        name,
        classification: {
            region: Region.Local,
            category: OrganisationCategory.Education,
            sector,
        },
        getOrganisation(row) {
            return {
                name: row.VESTIGINGSNAAM || row.INSTELLINGSNAAM || '',
                address: `${row.STRAATNAAM} ${row['HUISNUMMER-TOEVOEGING']}`,
                city: row.PLAATSNAAM,
                postcode: row.POSTCODE,
            }
        },
        getUrl(row) {
            return row.INTERNETADRES
        },
        delimiter: ';',
        headers: true,
    }
}

export default class RetrieveSchoolURLs extends CSVTask {
    name = 'retrieve-school-urls';
    description = 'Retrieve school URLs from DUO dataset';

    async onStart() {
        const imports = [
            this.importCSVFromURL(
                'https://duo.nl/open_onderwijsdata/images/02.-alle-schoolvestigingen-basisonderwijs.csv',
                getDuoConfig('duo-primary', EducationSector.Primary),
            ),
            this.importCSVFromURL(
                'https://duo.nl/open_onderwijsdata/images/adressen-vestigingen-caribisch-nederland.csv',
                getDuoConfig('duo-caribbean', EducationSector.Primary),
            ),
            this.importCSVFromURL(
                'https://duo.nl/open_onderwijsdata/images/02.-alle-vestigingen-vo.csv',
                getDuoConfig('duo-secondary', EducationSector.Secondary),
            ),
            this.importCSVFromURL(
                'https://duo.nl/open_onderwijsdata/images/01.-adressen-mbo-instellingen.csv',
                getDuoConfig('duo-mbo', EducationSector.Higher),
            ),
            this.importCSVFromURL(
                'https://duo.nl/open_onderwijsdata/images/01.-instellingen-hbo-en-wo.csv',
                getDuoConfig('duo-hbo-wo', EducationSector.Higher),
            ),
        ];

        await Promise.all(imports);
        this.finish();
    }
};