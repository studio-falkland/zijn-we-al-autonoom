import { PromisePool } from '@supercharge/promise-pool'
import db, { URL } from '../db';
import { Task } from '../lib/Task';
import { Resolver } from 'dns/promises';
import { cluster, objectify } from 'radash';
import IPToASN from '../lib/IPToAsn';
import parseURL from '../lib/ParseURL';

const ASN_LOOKUP_CHUNK = 2_000;

const resolver = new Resolver()
resolver.setServers([
    '8.8.8.8',
    '8.8.4.4',
]);

const RetrieveWebhost: Task = {
    name: 'retrieve-webhost',
    description: 'Retrieving webhosts',
    async onStart({ finish, updateProgress, updateTotal }) {
        const urls = db.prepare('SELECT * FROM urls').all() as URL[];

        const insertWebhost = db.prepare('INSERT INTO measurements (url, type, measurement) VALUES (@url, \'webhost\', @measurement)');
        const insertError = db.prepare('INSERT INTO measurement_errors (url, type, error, stack) VALUES (@url, \'webhost\', @error, @stack)');

        updateTotal(urls.length);

        const errors: string[] = [];
        const { results } = await PromisePool
            .withConcurrency(10)
            .withTaskTimeout(5_000)
            .handleError((err) => console.error(err))
            .for(urls.map((u) => u.url))
            .process(async (url, index) => {
                try {
                    const [ip] = await resolver.resolve4(url);
                    updateProgress((p) => p + 1);
                    return { ip, url };
                } catch (e) {
                    updateProgress((p) => p + 1);
                    insertError.run({
                        url,
                        error: e.message,
                        stack: e.stack,
                    });
                    errors.push(url);
                }
            });

        updateProgress(0)

        const ips = results.filter((r) => !!r);

        const insertMeasurements = db.transaction((data: { url: string, measurement: string }[]) => {
            for (const datum of data) {
                insertWebhost.run(datum);
            }
        });

        for await (const batch of cluster(ips, ASN_LOOKUP_CHUNK)) {
            const ipToUrlMap = objectify(batch, (o) => o.ip, (o) => o.url);
            const ips = batch.map((o) => o.ip)
            const results = await new IPToASN().query(ips);
            updateProgress((p) => p + batch.length);
            const mergedData = results.map((result) => {
                if (!result.address) return null;

                const url = parseURL(ipToUrlMap[result.address]);
                if (!url) return null;
                
                return {
                    url,
                    measurement: `${result.ASN}-${result.description}`,
                }
            }).filter((o) => !!o);

            insertMeasurements(mergedData);
        }

        for (const error in errors) {
            insertWebhost.run({ url: error, measurement: 'unknown_error' });
        }

        finish();
    },
};

export default RetrieveWebhost;