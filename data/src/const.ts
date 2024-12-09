import path from 'path';

export const DB_FOLDER = path.join(import.meta.dirname, '..', 'data');
export const DB_FILENAME = 'data.db';
export const DB_PATH = path.join(DB_FOLDER, DB_FILENAME);
