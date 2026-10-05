import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import { entities } from './entities.js';
import { migrationClasses } from './migrations.js';

/**
 * Create a DataSource wired with the shared schema.
 *
 * Runtime concerns — driver, database path, synchronize — are provided by the
 * consumer so that this package stays platform-agnostic (Node, Expo, ...).
 */
export function createDataSource(options: DataSourceOptions): DataSource {
    return new DataSource({
        ...options,
        entities,
        migrations: migrationClasses,
    });
}
