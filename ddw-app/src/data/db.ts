// Read-only connection to the bundled content database via TypeORM's expo driver.
import { createDataSource } from '@are-we-dependent/data';
import { Directory, File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import type { DataSource } from 'typeorm';

const DB_NAME = 'are-we-dependent.db';

// The expo-asset config plugin embeds the database as a native resource, so it
// ships inside the app binary in every build. SQLite must open a writable file
// in its managed directory, so copy the embedded resource there once.
async function seedDatabase(): Promise<void> {
    // expo-sqlite creates its directory lazily on first open; make sure it exists.
    const databaseDirectory = new Directory(SQLite.defaultDatabaseDirectory);
    databaseDirectory.create({ intermediates: true, idempotent: true });

    const destination = new File(databaseDirectory, DB_NAME);
    if (destination.exists) return;

    const bundled = new File(Paths.bundle, DB_NAME);
    if (!bundled.exists) {
        throw new Error(
            'Bundled database not found — rebuild the app (pnpm build:ios) so the expo-asset plugin can embed it.',
        );
    }
    await bundled.copy(destination);
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
