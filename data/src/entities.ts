import Organisation from './models/Organisation.js';
import URL from './models/URL.js';
import Measurement from './models/Measurement.js';
import MeasurementError from './models/MeasurementError.js';
import Dataset from './models/Dataset.js';
import OrganisationClassification from './models/Classification.js';
import Aggregate from './models/Aggregate.js';

export {
    Organisation,
    URL,
    Measurement,
    MeasurementError,
    Dataset,
    OrganisationClassification,
    Aggregate,
};

/** All entity classes, for use in DataSource configuration. */
export const entities = [
    Organisation,
    URL,
    Measurement,
    MeasurementError,
    Dataset,
    OrganisationClassification,
    Aggregate,
];
