import path from 'path';

export const DATE_NOW = new Date().toISOString().substring(0, 10);

export const DB_FOLDER = path.join(process.cwd(), 'data');
export const DB_FILENAME = 'data.db';
export const DB_PATH = path.join(DB_FOLDER, DB_FILENAME);