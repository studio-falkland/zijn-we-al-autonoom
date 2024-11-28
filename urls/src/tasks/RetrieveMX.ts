import { PromisePool } from '@supercharge/promise-pool'
import { Resolver } from 'dns/promises';
import db, { URL } from '../db';
import { Task } from '../lib/Task';
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
        const urls = db.prepare('SELECT * FROM urls').all() as URL[];

        const insertMx = db.prepare('INSERT INTO measurements (url, type, measurement) VALUES (@url, \'mx\', @measurement)');
        const insertMxRoot = db.prepare('INSERT INTO measurements (url, type, measurement) VALUES (@url, \'mx-root\', @measurement)');
        const insertError = db.prepare('INSERT INTO measurement_errors (url, type, error, stack) VALUES (@url, \'mx\', @error, @stack)');

        updateTotal(urls.length);

        await PromisePool
            .withConcurrency(10)
            .withTaskTimeout(5_000)
            .handleError((err) => console.error(err))
            .for(urls.map((u) => u.url))
            .process(async (url, index) => {
                try {
                    const [mx] = await resolver.resolveMx(url);
                    const [ip] = await resolver.resolve4(mx.exchange);
                    const [hostname] = await resolver.reverse(ip);
                    const root = psl.get(hostname);
                    insertMx.run({ url, measurement: hostname });
                    insertMxRoot.run({ url, measurement: root });
                } catch (e) {
                    insertError.run({
                        url,
                        error: e.message,
                        stack: e.stack,
                    });
                    insertMx.run({ url, measurement: 'unknown_error' });
                    insertMxRoot.run({ url, measurement: 'unknown_error' });
                }

                updateProgress((p) => p + 1);
            });

        finish();
    }
}

export default RetrieveMX;