import { mkdirSync } from 'fs';
import { dirname } from 'path';
import sqlite from 'better-sqlite3';
import { createDataSource } from '@are-we-dependent/data';
import { DB_PATH } from '@are-we-dependent/data/const';

// The database directory must exist before the DataSource opens the file.
mkdirSync(dirname(DB_PATH), { recursive: true });

const db = createDataSource({
    type: 'better-sqlite3',
    database: DB_PATH,
    driver: sqlite,
});

// The app runs against a prepared database; migrations are not run at runtime.
db.setOptions({ migrations: undefined });
await db.initialize();

export default db;
