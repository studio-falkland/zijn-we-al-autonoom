import { DB_FOLDER, DB_PATH, MIGRATIONS_GLOB } from './const.js';
import fs from 'fs/promises';
import { DataSource } from 'typeorm';

import Organisation from './models/Organisation.js';
import URL from './models/URL.js';
import Measurement from './models/Measurement.js';
import MeasurementError from './models/MeasurementError.js';
import Dataset from './models/Dataset.js';
import OrganisationClassification from './models/Classification.js';

await fs.mkdir(DB_FOLDER, { recursive: true });

// Open the database
const db = new DataSource({
    type: 'better-sqlite3',
    database: DB_PATH,
    migrations: [MIGRATIONS_GLOB],
    entities: [
        Organisation,
        URL,
        Measurement,
        MeasurementError,
        Dataset,
        OrganisationClassification,
    ],
    migrationsTransactionMode: 'each',
});

export { Organisation, URL, Measurement, MeasurementError, Dataset, OrganisationClassification };
export * from './hierarchy.js';

export default db;
