import Database from 'better-sqlite3';
import fs from 'fs/promises';
import path from 'path';

const DB_DIRECTORY = path.join(process.cwd(), '..', 'extraction', 'data');
const entries = await fs.readdir(DB_DIRECTORY);
const dbFile = entries.sort().reverse().find((entry) => entry.endsWith('.db'));

if (!dbFile) {
    throw new Error('No database file found');
}

const db = new Database(path.join(DB_DIRECTORY, dbFile), {});
db.pragma('journal_mode = WAL');

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

export default db;
