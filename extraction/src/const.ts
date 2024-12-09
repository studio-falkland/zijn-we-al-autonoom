import { DB_FOLDER } from '@are-we-dependent/data/src/const.js';
import path from 'path';

export const DATE_NOW = new Date().toISOString().substring(0, 10);

export const LOG_FOLDER = path.join(DB_FOLDER, 'logs');
export const LOG_FILENAME = 'log-' + DATE_NOW + '.log';
export const LOG_PATH = path.join(LOG_FOLDER, LOG_FILENAME);
