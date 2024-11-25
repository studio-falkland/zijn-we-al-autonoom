import Database from 'better-sqlite3';
import { DB_FOLDER, DB_PATH } from './const';
import fs from 'fs/promises';

await fs.mkdir(DB_FOLDER, { recursive: true });

// Open the database
const db = new Database(DB_PATH, {});
db.pragma('journal_mode = WAL');

// Migrate the schema
db.exec(`
    CREATE TABLE IF NOT EXISTS urls (
        id INTEGER PRIMARY KEY,
        url TEXT,
        category TEXT,
        organisation_id INTEGER,
        UNIQUE(url)
    );

    CREATE TABLE IF NOT EXISTS organisations (
        id INTEGER PRIMARY KEY,
        name TEXT,
        source TEXT,
        category TEXT,
        UNIQUE(name)
    );

    CREATE TABLE IF NOT EXISTS measurements (
        id INTEGER PRIMARY KEY,
        url TEXT,
        type TEXT,
        measurement TEXT
    );

    CREATE INDEX IF NOT EXISTS url_idx ON urls (url);

    CREATE TABLE IF NOT EXISTS measurement_errors (
        id INTEGER PRIMARY KEY,
        url TEXT,
        type TEXT,
        error TEXT
    )
`);

export interface URL {
    id: number;
    url: string,
    organisation_id?: number;
}

export interface Measurement {
    id: number;
    url_id: number;
    type: string;
    measurement: string;
}

export default db;
