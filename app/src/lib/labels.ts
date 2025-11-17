import { BusinessSector, Category, DestinationDataset, EducationSector, FinancialSector, GovernmentSector, HealthcareSector, Region, Sectors } from '@are-we-dependent/data/hierarchy';

export const regionLabels: Record<Region, string> = {
    [Region.Local]: 'Regionaal',
    [Region.National]: 'Nationaal',
};

export function getRegionLabel(region: Region): string {
    return regionLabels[region];
}

export const categoryLabels: Record<Category, string> = {
    [Category.Government]: 'Overheid',
    // [Category.Financial]: 'Financieel',
    [Category.Business]: 'Bedrijven',
    [Category.Defense]: 'Defensie',
    [Category.Healthcare]: 'Zorg',
    [Category.Education]: 'Onderwijs',
    [Category.DotNL]: '.nl',
};

export function getCategoryLabel(category: Category): string {
    return categoryLabels[category];
}

export const sectorLabels: Record<Sectors, string> = {
    [GovernmentSector.Ministry]: 'Ministerie',
    [GovernmentSector.Province]: 'Provincie',
    [GovernmentSector.Municipality]: 'Gemeente',
    [GovernmentSector.WaterBoard]: 'Waterschap',
    [GovernmentSector.Other]: 'Overig',
    [FinancialSector.Bank]: 'Bank',
    [FinancialSector.PaymentProvider]: 'Betalingsdienstverlener',
    [FinancialSector.Insurance]: 'Verzekeraar',
    [FinancialSector.Other]: 'Overig',
    [BusinessSector.Largest]: '500 grootste bedrijven',
    [BusinessSector.Other]: 'Overige',
    [HealthcareSector.Hospital]: 'Ziekenhuis',
    [HealthcareSector.Pharmacy]: 'Apotheek',
    [HealthcareSector.Dentist]: 'Tandarts',
    [HealthcareSector.Physiotherapist]: 'Fysiotherapeut',
    [HealthcareSector.NursingHome]: 'Verzorgingstehuis',
    [HealthcareSector.Other]: 'Overig',
    [EducationSector.Daycare]: 'Kinderopvang',
    [EducationSector.Primary]: 'Basisschool',
    [EducationSector.Secondary]: 'Middelbaar onderwijs',
    [EducationSector.Higher]: 'Hoger onderwijs',
};

export function getSectorLabel(sector: Sectors): string {
    return sectorLabels[sector];
}

export const datasetLabels: Record<DestinationDataset, string> = {
    [DestinationDataset.EmailAS]: 'E-mail',
    [DestinationDataset.WebhostingAS]: 'Webhosting',
    [DestinationDataset.WebhostingIP]: 'Webhosting',
};

export function getDatasetLabel(dataset: DestinationDataset): string {
    return datasetLabels[dataset];
}