import db, { Measurement, MeasurementError, URL } from '@are-we-dependent/data';
import { Task } from './index.jsx';

export default class MeasurementTask extends Task {
    async insertMeasurement(
        values: Omit<Partial<Measurement>, 'id' | 'created_at' | 'error' | 'url'> & { url: URL | (() => string) },
        errorId?: number,
    ) {
        try {
            return await db.createQueryBuilder()
                .insert()
                .into(Measurement)
                .values({
                    ...values,
                    error: errorId ? { id: errorId } : null,
                })
                .execute();
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            const stack = err instanceof Error ? err.stack : undefined;
            this.log(`Failed to insert measurement for URL "${typeof values.url === 'function' ? values.url() : values.url?.url}": ${message}`, { stack });
        }
    }

    async insertError(
        type: string,
        url: string,
        error: Error,
    ) {
        try {
            // First, insert the error
            const result = await db.createQueryBuilder()
                .insert()
                .into(MeasurementError)
                .values({
                    error: error.message,
                    stack: error.stack,
                })
                .returning('id')
                .execute();

            // Then, insert the measurement with the error
            return this.insertMeasurement({
                type,
                url,
                data: "error"
            }, result.raw[0].id);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            const stack = err instanceof Error ? err.stack : undefined;
            this.log(`Failed to insert error record for URL "${url}": ${message}`, { stack });
        }
    }

    async getAllURLs() {
        const urls = await db.manager
            .createQueryBuilder(URL, 'url')
            .getMany();

        this.log(`Retrieved ${urls.length} URLs.`);

        return urls;
    }
}
