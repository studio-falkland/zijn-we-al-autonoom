/** The locality of a particular organisation  */
export enum Region {
    /** The organisation can be attributed to a single location and its
     * "market" is localised */
    Local = 'local',
    /** The organisation cannot be attributed to a single location and its
     * "market" is all Dutch citizens */
    National = 'national',
}

/** A category for a single organisation */
export enum OrganisationCategory {
    Government = 'government',
    Financial = 'financial',
    Business = 'business',
    Defense = 'defense',
    Healthcare = 'healthcare',
    Education = 'education',
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
    HealthcareProvider = 'healthcare_provider',
    Pharmacy = 'healthcare_pharmacy',
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
        type: OrganisationCategory;
        children: {
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
                type: OrganisationCategory.Government,
                children: [
                    { type: GovernmentSector.Province },
                    { type: GovernmentSector.Municipality },
                    { type: GovernmentSector.Other },
                ],
            },
            {
                type: OrganisationCategory.Business,
                children: [
                    { type: BusinessSector.Other },
                ],
            },
            {
                type: OrganisationCategory.Healthcare,
                children: [
                    { type: HealthcareSector.Hospital },
                    { type: HealthcareSector.HealthcareProvider },
                    { type: HealthcareSector.Pharmacy },
                ],
            },
            {
                type: OrganisationCategory.Education,
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
                type: OrganisationCategory.Government,
                children: [
                    { type: GovernmentSector.Ministry },
                ],
            },
            {
                type: OrganisationCategory.Financial,
                children: [
                    { type: FinancialSector.Bank },
                    { type: FinancialSector.PaymentProvider },
                    { type: FinancialSector.Insurance },
                    { type: FinancialSector.Other },
                ],
            },
            {
                type: OrganisationCategory.Business,
                children: [
                    { type: BusinessSector.Largest },
                    { type: BusinessSector.Other },
                ],
            },
        ],
    },
];

/** A flat variant of the hierarchy, where all leaves of the hierarchy are made available as an array */
export const flatHierarchy = hierarchy.flatMap((region) => {
    return region.children.flatMap((category) => {
        return category.children.flatMap((sector) => {
            return {
                sector: sector.type,
                category: category.type,
                region: region.type,
            };
        });
    });
});

export default hierarchy;
