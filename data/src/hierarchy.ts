/** The locality of a particular organisation  */
export enum Region {
    /** The organisation can be attributed to a single location and its
     * "market" is localised */
    Local = 'local',
    /** The organisation cannot be attributed to a single location and its
     * "market" is all Dutch citizens */
    National = 'national',
}

/** A dataset that is gathered for a combination of a region and sector */
export enum DestinationDataset {
    EmailAS = 'email-as',
    WebhostingAS = 'webhosting-as',
    WebhostingIP = 'webhosting-ip',
}

/** A category for a single organisation */
export enum Category {
    Government = 'government',
    // Financial = 'financial',
    Business = 'business',
    Defense = 'defense',
    Healthcare = 'healthcare',
    Education = 'education',
    DotNL = 'dot-nl',
}

export enum GovernmentSector {
    Ministry = 'government_ministry',
    Province = 'government_province',
    Municipality = 'government_municipality',
    WaterBoard = 'government_water_board',
    Other = 'government_other',
}

export enum FinancialSector {
    Bank = 'financial_bank',
    PaymentProvider = 'financial_payment_provider',
    Insurance = 'financial_insurance',
    Other = 'financial_other',
}

export enum BusinessSector {
    Largest = 'business_largest',
    Other = 'business_other',
}

export enum HealthcareSector {
    Hospital = 'healthcare_hospital',
    Pharmacy = 'healthcare_pharmacy',
    Dentist = 'healthcare_dentist',
    Physiotherapist = 'healthcare_physiotherapist',
    NursingHome = 'healthcare_nursing_home',
    Other = 'healthcare_other',
}

export enum EducationSector {
    Daycare = 'education_daycare',
    Primary = 'education_primary',
    Secondary = 'education_secondary',
    Higher = 'education_higher',
}

export const sectors = [GovernmentSector, FinancialSector, BusinessSector, HealthcareSector, EducationSector];
export type Sectors = GovernmentSector | FinancialSector | BusinessSector | HealthcareSector | EducationSector;

export type Hierarchy = {
    type: Region;
    children: {
        type: Category;
        description: string;
        children?: {
            type: GovernmentSector
                | FinancialSector
                | BusinessSector
                | HealthcareSector
                | EducationSector;
        }[];
    }[];
}[];

/** This hierarchy describes the full set of organisations that are tracked in
 * the index. */
const hierarchy: Hierarchy = [
    {
        type: Region.Local,
        children: [
            {
                type: Category.Government,
                description: 'Lokale overheden zoals provincies, gemeenten en waterschappen.',
                children: [
                    { type: GovernmentSector.Province },
                    { type: GovernmentSector.Municipality },
                    { type: GovernmentSector.Other },
                    { type: GovernmentSector.WaterBoard },
                ],
            },
            {
                type: Category.Healthcare,
                description: 'Lokale zorgaanbieders, zoals ziekenhuizen, apotheken, tandartsen en fysiotherapeuten.',
                children: [
                    { type: HealthcareSector.Hospital },
                    { type: HealthcareSector.Pharmacy },
                    { type: HealthcareSector.Physiotherapist },
                    { type: HealthcareSector.Dentist },
                    { type: HealthcareSector.Other },
                ],
            },
            {
                type: Category.Education,
                description: 'Aanbieders van lager, middelbaar en hoger onderwijs.',
                children: [
                    { type: EducationSector.Daycare },
                    { type: EducationSector.Primary },
                    { type: EducationSector.Secondary },
                    { type: EducationSector.Higher },
                ],
            },
        ],
    },
    {
        type: Region.National,
        children: [
            {
                type: Category.Government,
                description: 'Landelijke overheden, zoals ministeries en agentschappen.',
                children: [
                    { type: GovernmentSector.Ministry },
                ],
            },
            // {
            //     type: Category.Financial,
            //     description: 'Finciële dienstverleners, zoals banken, betalingsverwerkes en verzekeraars.',
            //     children: [
            //         { type: FinancialSector.Bank },
            //         { type: FinancialSector.PaymentProvider },
            //         { type: FinancialSector.Insurance },
            //         { type: FinancialSector.Other },
            //     ],
            // },
            {
                type: Category.Business,
                description: 'De grootste bedrijven van Nederland',
                children: [
                    { type: BusinessSector.Largest },
                    { type: BusinessSector.Other },
                ],
            },
            {
                type: Category.DotNL,
                description: 'Alle .nl-domeinen'
            }
        ],
    },
];

/** A flat variant of the hierarchy, where all leaves of the hierarchy are made available as an array */
export const flatHierarchy = hierarchy.flatMap((region) => {
    return region.children.flatMap((category) => {
        return category.children?.flatMap((sector) => {
            return {
                sector: sector.type,
                category: category.type,
                region: region.type,
            };
        });
    });
});

export default hierarchy;
