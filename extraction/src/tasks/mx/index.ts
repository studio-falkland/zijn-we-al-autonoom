import { PromisePool } from '@supercharge/promise-pool'
import { Resolver } from 'dns/promises';
import db, { insertError, insertMeasurement, URL } from '@/db.js';
import { Task } from '../lib/Task.jsx';
import psl from 'psl';

const resolver = new Resolver()
resolver.setServers([
    '8.8.8.8',
    '8.8.4.4',
]);

const RetrieveMX: Task = {
    name: 'check-mx',
    description: 'Retrieving MX records',
    async onStart({ finish, updateProgress, updateTotal }) {
        // Retrieve all URLs in the database
        const urls = db.prepare('SELECT * FROM urls').all() as URL[];

        updateTotal(urls.length);

        await PromisePool
            .withConcurrency(25)
            .withTaskTimeout(5_000)
            .handleError((err) => console.error(err))
            .for(urls)
            .process(async ({ url }, index) => {
                try {
                    const [mx] = await resolver.resolveMx(url);
                    const [ip] = await resolver.resolve4(mx.exchange);
                    const [hostname] = await resolver.reverse(ip);
                    const root = psl.get(hostname);
                    insertMeasurement.run({ url, measurement: hostname, type: 'mx' });
                    insertMeasurement.run({ url, measurement: root, type: 'mx-root' });
                } catch (e) {
                    insertError.run({
                        url,
                        error: e.message,
                        stack: e.stack,
                        type: 'mx',
                    });
                    insertMeasurement.run({ url, measurement: 'unknown_error', type: 'mx' });
                    insertMeasurement.run({ url, measurement: 'unknown_error', type: 'mx-root' });
                }

                updateProgress((p) => p + 1);
            });

        finish();
    }
}

export default RetrieveMX;