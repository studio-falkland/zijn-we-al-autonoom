// Read-only connection to the bundled content database via TypeORM's expo driver.
import { createDataSource } from '@are-we-dependent/data';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import type { DataSource } from 'typeorm';

// The bundled database asset, served by Metro (extension registered by expo-sqlite).
const DB_ASSET = require('../../../data/db/are-we-dependent.db') as number;
const DB_NAME = 'are-we-dependent.db';

// Copy the bundled database into expo-sqlite's directory on first launch.
async function seedDatabase(): Promise<void> {
    const destination = new File(SQLite.defaultDatabaseDirectory, DB_NAME);
    if (destination.exists) return;
    const asset = await Asset.fromModule(DB_ASSET).downloadAsync();
    if (!asset.localUri) throw new Error(`Unable to resolve bundled database ${DB_NAME}`);
    await new File(asset.localUri).copy(destination);
}

// The app data source: expo driver, no synchronize, no migrations (read-only).
// The driver is passed explicitly so Metro bundles expo-sqlite (dynamic requires fail).
export const db = createDataSource({
    type: 'expo',
    database: DB_NAME,
    driver: SQLite,
});
db.setOptions({ migrations: undefined, synchronize: false });

// Lazily seed + connect once; screens await this before querying.
let ready: Promise<DataSource> | null = null;
export function ensureDb(): Promise<DataSource> {
    ready ??= seedDatabase().then(() => db.initialize());
    return ready;
}
