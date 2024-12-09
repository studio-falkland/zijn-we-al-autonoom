import db, { Measurement, MeasurementError, URL } from '@are-we-dependent/data';
import { Task } from './index.jsx';

export default class MeasurementTask extends Task {
    async insertMeasurement(
        type: string,
        url: string,
        data: string,
        errorId?: number,
    ) {
        return db.createQueryBuilder()
            .insert()
            .into(Measurement)
            .values({
                type,
                url,
                data,
                error: errorId ? { id: errorId } : null,
            })
            .execute();
    }

    async insertError(
        type: string,
        url: string,
        error: Error,
    ) {
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
        return this.insertMeasurement(
            type,
            url,
            'error',
            result.raw[0].id,
        );
    }

    async getAllURLs() {
        const urls = await db.manager
            .createQueryBuilder(URL, 'url')
            .getMany();

        this.log(`Retrieved ${urls.length} URLs.`);

        return urls;
    }
}
