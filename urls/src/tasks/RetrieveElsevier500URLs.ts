import { parse } from '@fast-csv/parse';
import { Task } from '../lib/Task';
import { ElsevierOrganisation } from '../lib/Elsevier';
import { createReadStream } from 'fs';
import db from '../db';

const RetrieveElsevier500URLs: Task = {
    name: 'retrieve-elsevier-500-urls',
    description: 'Retrieving Top 500 URLs',
    async onStart({ finish, updateProgress, updateTotal }) {
        const rows: ElsevierOrganisation[] = [];

        updateProgress(0);

        await new Promise((resolve, reject) => {
            createReadStream('../eda/top-500-bedrijven.csv')
                .pipe(parse({ headers: true, delimiter: ';' }))
                .on('data', (row) => {
                    rows.push(row);
                })
                .on('end', resolve)
                .on('error', reject);
        });

        updateTotal(rows.length);

        const insertUrl = db.prepare('INSERT OR IGNORE INTO urls (url, category, organisation_id) VALUES (@url, @category, null);');

        const insertAllURLs = db.transaction((orgs: ElsevierOrganisation[]) => {
            for (const org of orgs) {
                insertUrl.run({ 
                    url: org.Domeinnaam,
                    category: `elsevier_500`
                });

                updateProgress((n) => n + 1)
            }
        });

        insertAllURLs(rows);
        updateProgress(rows.length);

        finish();
    },
}

export default RetrieveElsevier500URLs;