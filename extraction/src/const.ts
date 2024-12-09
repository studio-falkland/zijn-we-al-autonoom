import path from 'path';

export const DATE_NOW = new Date().toISOString().substring(0, 10);

export const DB_FOLDER = path.join(process.cwd(), 'data');
export const DB_FILENAME = 'data.db';
export const DB_PATH = path.join(DB_FOLDER, DB_FILENAME);

export const LOG_FOLDER = path.join(DB_FOLDER, 'logs');
export const LOG_FILENAME = 'log-' + DATE_NOW + '.log';
export const LOG_PATH = path.join(LOG_FOLDER, LOG_FILENAME);