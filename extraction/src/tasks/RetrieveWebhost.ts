import { PromisePool } from '@supercharge/promise-pool'
import db, { insertError, insertMeasurement, Measurement, URL } from '../db';
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
        // Retrieve all URLs
        const urls = db.prepare('SELECT * FROM urls').all() as URL[];
        updateTotal(urls.length);

        const errors: string[] = [];

        const { results } = await PromisePool
            .withConcurrency(25)
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
                        type: 'webhost',
                    });
                    errors.push(url);
                }
            });

        updateProgress(0)

        const ips = results.filter((r) => !!r);

        const insertMeasurements = db.transaction((data: { url: string, measurement: string }[]) => {
            for (const datum of data) {
                insertMeasurement.run(datum);
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
                    type: 'webhost',
                } as Omit<Measurement, 'id'>
            }).filter((o) => !!o);

            insertMeasurements(mergedData);
        }

        for (const error in errors) {
            insertMeasurement.run({ url: error, type: 'webhost', measurement: 'unknown_error' });
        }

        finish();
    },
};

export default RetrieveWebhost;