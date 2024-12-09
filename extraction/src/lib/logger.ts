import { LOG_FOLDER, LOG_PATH } from '@/const.js';
import pino from 'pino';
import fs from 'fs/promises';

// First, make sure the log folder is actually created
await fs.mkdir(LOG_FOLDER, { recursive: true });

// Then, setup the default pino transport
const transport = pino.transport({
    target: 'pino-pretty',
    options: {
        destination: LOG_PATH,
        colorize: false,
        ignore: 'pid,hostname',
    },
});

// Initialise the logger
const logger = pino.default(transport);

// And append a log to the file so we know a new run is started
logger.info('Extractor initialised. Running tasks...');

export default logger;
