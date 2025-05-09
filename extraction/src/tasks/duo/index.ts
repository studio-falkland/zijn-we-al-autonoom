import CSVTask, { BaseCSVDatasetConfig } from '@/lib/task/CSVTask.jsx';
import { EducationSector, Category, Region } from '@are-we-dependent/data';
import { DUORow } from './types.js';

/**
 * Represents a source of DUO education data
 */
interface DuoSource {
    /** URL of the HTML page containing the CSV download link */
    pageUrl: string;
    /** Identifier for the dataset */
    name: string;
    /** Education sector this data belongs to */
    sector: EducationSector;
}

export default class RetrieveSchoolURLs extends CSVTask {
    name = 'retrieve-school-urls';
    description = 'Retrieve school URLs from DUO dataset';

    /**
     * Fetches the HTML page and extracts the CSV download URL
     * @param htmlUrl URL of the HTML page containing the CSV download link
     * @returns The full URL to download the CSV file
     * @throws Error if the page cannot be fetched or no CSV link is found
     */
    private async getDownloadUrl(htmlUrl: string): Promise<string> {
        const response = await fetch(htmlUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${htmlUrl}: ${response.status} ${response.statusText}`);
        }
        
        const html = await response.text();
        
        // Match the CSV download URL patter\n with the full base URL
        const match = html.match(/\/open_onderwijsdata\/images\/[^"]+\.csv/);
        if (!match) {
            throw new Error(`Could not find CSV download URL in ${htmlUrl}`);
        }
        
        return `https://duo.nl${match[0]}`;
    }

    /**
     * Creates a configuration object for processing DUO data
     */
    private getDuoConfig(
        name: string,
        sector: EducationSector,
    ): BaseCSVDatasetConfig<DUORow> {
        return {
            name,
            classification: {
                region: Region.Local,
                category: Category.Education,
                sector,
            },
            getOrganisation(row) {
                return {
                    name: row.VESTIGINGSNAAM || row.INSTELLINGSNAAM || '',
                    address: `${row.STRAATNAAM} ${row['HUISNUMMER-TOEVOEGING']}`,
                    city: row.PLAATSNAAM,
                    postcode: row.POSTCODE,
                };
            },
            getUrl(row) {
                return row.INTERNETADRES;
            },
            delimiter: ';',
            headers: true,
        };
    }

    /**
     * Processes a single DUO data source
     * @param source The source configuration
     */
    private async processSource(source: DuoSource): Promise<void> {
        const downloadUrl = await this.getDownloadUrl(source.pageUrl);
        await this.importCSVFromURL(
            downloadUrl,
            this.getDuoConfig(source.name, source.sector),
        );
    }

    async onStart() {
        // Define all data sources
        const promises = [
            this.processSource({
                pageUrl: 'https://duo.nl/open_onderwijsdata/primair-onderwijs/scholen-en-adressen/schoolvestigingen-basisonderwijs.jsp',
                name: 'duo-primary',
                sector: EducationSector.Primary,
            }),
            this.processSource({
                pageUrl: 'https://duo.nl/open_onderwijsdata/caribisch-nederland/adressen/adressen-scholen.jsp',
                name: 'duo-caribbean',
                sector: EducationSector.Primary,
            }),
            this.processSource({
                pageUrl: 'https://duo.nl/open_onderwijsdata/voortgezet-onderwijs/adressen/vestigingen.jsp',
                name: 'duo-secondary',
                sector: EducationSector.Secondary,
            }),
            this.processSource({
                pageUrl: 'https://duo.nl/open_onderwijsdata/middelbaar-beroepsonderwijs/adressen/adressen-instellingen-mbo.jsp',
                name: 'duo-mbo',
                sector: EducationSector.Higher,
            }),
            this.processSource({
                pageUrl: 'https://duo.nl/open_onderwijsdata/hoger-onderwijs/adressen/hogescholen-en-universiteiten.jsp',
                name: 'duo-hbo-wo',
                sector: EducationSector.Higher,
            }),
        ];

        await Promise.all(promises);
        this.finish();
    }
}
