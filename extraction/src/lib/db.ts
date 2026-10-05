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

export default db;
