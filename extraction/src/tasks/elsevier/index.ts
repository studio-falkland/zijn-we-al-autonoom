import { BusinessSector, OrganisationCategory, Region } from '@/hierarchy.js';
import CSVTask from '@/lib/task/CSVTask.jsx';
import { ElsevierOrganisation } from '@/tasks/elsevier/types.js';

const DATASET_LOCATION = '../sources/elsevier-500.csv';

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
                    category: OrganisationCategory.Business,
                    sector: BusinessSector.Largest,
                },
                getOrganisation: (r) => ({
                    name: r.Bedrijfsnaam,
                }),
                getUrl: (r) => r.Domeinnaam,
                delimiter: ';',
            }
        );

        this.finish();
    }
}

export default RetrieveElsevier500URLs;