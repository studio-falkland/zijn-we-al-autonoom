import { Pragma1733487496374 } from './migrations/1733487496374-pragma.js';
import { M1733488598105 } from './migrations/1733488598105-m.js';
import { M1733490131937 } from './migrations/1733490131937-m.js';
import { M1733492735586 } from './migrations/1733492735586-m.js';
import { M1733493578775 } from './migrations/1733493578775-m.js';
import { M1733500559125 } from './migrations/1733500559125-m.js';
import { MeasurementMetadata1734022271813 } from './migrations/1734022271813-measurement-metadata.js';
import { MeasurementAsCountryCode1738962782096 } from './migrations/1738962782096-measurement-as-country-code.js';
import { Aggregate1738963113011 } from './migrations/1738963113011-aggregate.js';
import { Indexes1740397478530 } from './migrations/1740397478530-indexes.js';

/** All migration classes, for use in DataSource configuration. */
export const migrationClasses = [
    Pragma1733487496374,
    M1733488598105,
    M1733490131937,
    M1733492735586,
    M1733493578775,
    M1733500559125,
    MeasurementMetadata1734022271813,
    MeasurementAsCountryCode1738962782096,
    Aggregate1738963113011,
    Indexes1740397478530,
];
