import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { DataSource } from 'typeorm';
import sqlite from 'better-sqlite3';
import { DB_PATH } from './const.js';
import { entities } from './entities.js';
import { migrationClasses } from './migrations.js';

// Node-only convenience entry used by the typeorm CLI (migrations:* scripts).
mkdirSync(dirname(DB_PATH), { recursive: true });

export default new DataSource({
    type: 'better-sqlite3',
    database: DB_PATH,
    driver: sqlite,
    entities,
    migrations: migrationClasses,
});
