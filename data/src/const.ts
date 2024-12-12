import path from 'path';

export const ROOT_FOLDER = path.join(import.meta.dirname, '..');

export const SOURCES_FOLDER = path.join(ROOT_FOLDER, 'sources');

export const DB_FOLDER = path.join(ROOT_FOLDER, 'db');
export const DB_FILENAME = 'are-we-dependent.db';
export const DB_PATH = path.join(DB_FOLDER, DB_FILENAME);

export const MIGRATIONS_FOLDER = path.join(ROOT_FOLDER, 'src', 'migrations')
export const MIGRATIONS_GLOB = path.join(MIGRATIONS_FOLDER, '**/*.ts');