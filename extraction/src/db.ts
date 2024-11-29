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
        url TEXT NOT NULL,
        category TEXT NOT NULL,
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
        url TEXT NOT NULL,
        type TEXT NOT NULL,
        measurement TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS url_idx ON urls (url);

    CREATE TABLE IF NOT EXISTS measurement_errors (
        id INTEGER PRIMARY KEY,
        url TEXT,
        type TEXT,
        error TEXT,
        stack TEXT
    )
`);

export interface Organisation {
    id: number;
    name: string;
    source: string;
    category: string;
}

export interface URL {
    id: number;
    category: string;
    url: string;
    organisation_id: number | bigint | null;
}

export interface Measurement {
    id: number;
    url: string;
    type: string;
    measurement: string;
}

export interface MeasurementError {
    id: number;
    url: string;
    type: string;
    error: string;
    stack?: string;
}

// Insert a single organisation into the database
export const insertOrganisation = db.prepare<Omit<Organisation, 'id'>>(`
    INSERT OR IGNORE INTO organisations (name, source, category) 
    VALUES (@name, @source, @category);
`);

// Insert a single URL into the database
export const insertUrl = db.prepare<Omit<URL, 'id'>>(`
    INSERT OR IGNORE INTO urls (url, category, organisation_id)
    VALUES (@url, @category, @organisation_id);
`);

// Insert a single measurement into the database
export const insertMeasurement = db.prepare(`
    INSERT INTO measurements (url, type, measurement)
    VALUES (@url, @type, @measurement);
`);

// Insert a single measurement error into the database
export const insertError = db.prepare<Omit<MeasurementError, 'id'>>(`
    INSERT INTO measurement_errors (url, type, error, stack)
    VALUES (@url, @type, @error, @stack);
`);

export default db;
