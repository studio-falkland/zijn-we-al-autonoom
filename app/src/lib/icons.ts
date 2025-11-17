import { Category, DestinationDataset, Region } from '@are-we-dependent/data/hierarchy';
import { Building2, CircleHelp, Flag, GraduationCap, Hospital, Landmark, LucideIcon, Mail, PiggyBank, Server, Shield } from 'lucide-react';

/**
 * A record describing which category should correspond to which icon
 */
export const categoryIcons: Record<Category, LucideIcon> = {
    [Category.Business]: Building2,
    [Category.Defense]: Shield,
    [Category.Education]: GraduationCap,
    // [Category.Financial]: PiggyBank,
    [Category.Government]: Landmark,
    [Category.Healthcare]: Hospital,
    [Category.DotNL]: Flag,
};

/**
 * Retrieve a single icon for a given category
 */
export function getIconForCategory(category: Category): LucideIcon {
    return categoryIcons[category] || CircleHelp;
}

export const regionIcons: Record<Region, LucideIcon> = {
    [Region.Local]: Flag,
    [Region.National]: Landmark,
}

export function getIconForRegion(region: Region): LucideIcon {
    return regionIcons[region] || CircleHelp;
}

export const datasetIcons: Record<DestinationDataset, LucideIcon> = {
    [DestinationDataset.EmailAS]: Mail,
    [DestinationDataset.WebhostingAS]: Server,
    [DestinationDataset.WebhostingIP]: Server,
}

export function getIconForDataset(dataset: DestinationDataset): LucideIcon {
    return datasetIcons[dataset] || CircleHelp;
}

/**
 * Retrieve a flag emoji for a particular countrry code
 */
export function getEmojiForCountryCode(countryCode?: string) {
    // GUARD: Ensure the country code exsits
    if (!countryCode) return null;

    // GUARD: Ensure the countrycode has a valid format
    if (countryCode.length > 2) throw new Error('Invalid country code');

    // Convert to a UTF codepoint for that flag
    return countryCode.toUpperCase()
        .split('')
        .map((char) => String.fromCodePoint(char.charCodeAt(0) + 0x1f1a5))
        .join('');
}