import CSVTask from '@/lib/task/CSVTask.jsx';
import { ElsevierOrganisation } from '@/tasks/elsevier/types.js';
import { Region, Category, BusinessSector } from '@are-we-dependent/data';

const DATASET_LOCATION = '../data/sources/elsevier-500.csv';

class RetrieveElsevier500URLs extends CSVTask {
    name = 'retrieve-elsevier-500-urls';
    description = 'Retrieving Elsevier 500';
    async onStart() {
        await this.importCSVFromPath<ElsevierOrganisation>(
            DATASET_LOCATION,
            {
                name: 'elsevier-500',
                classification: {
                    region: Region.National,
                    category: Category.Business,
                    sector: BusinessSector.Largest,
                },
                getOrganisation: (r) => ({
                    name: r.Bedrijfsnaam,
                }),
                getUrl: (r) => r.Domeinnaam,
                delimiter: ';',
            },
        );

        this.finish();
    }
}

export default RetrieveElsevier500URLs;
