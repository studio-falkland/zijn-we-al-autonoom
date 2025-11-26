import { Category, DestinationDataset, Sectors } from '@are-we-dependent/data';
import { getCategoryLabel, getDatasetLabel, getSectorLabel } from './labels';
import { Metadata } from 'next';

/**
 * The default site name used in the metadata.
 */
const SITE_NAME = 'Zijn we al autonoom?';

/**
 * Create a metadata object with the given title and description.
 */
export function createMetadata({ title, description }: {
    title?: string;
    description?: string;
} | undefined = {}): Metadata {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    const fullDescription = description ?? 'Zijn we al autonoom brengt in kaart van welke organisaties het internet in Nederland het meest afhankelijk is.';

    return {
        title: fullTitle,
        description: fullDescription,
        openGraph: {
            title: fullTitle,
            description: fullDescription,
            siteName: SITE_NAME,
            type: 'website',
            locale: 'nl_NL',
        },
        twitter: {
            card: 'summary_large_image',
            title: fullTitle,
            description: fullDescription,
        },
    };
}

/**
 * Create a dependency description for the given subject and dataset.
 */
function createDependencyDescription(subject: string, dataset?: string): string {
    const datasetPart = dataset ? ` op het gebied van ${dataset} infrastructuur` : '';
    return `Bekijk de afhankelijkheid van ${subject}${datasetPart} in Nederland.`;
}

export function createPageMetadata({ 
    dataset, 
    category, 
    sector,
    organisationName,
}: {
    dataset?: DestinationDataset;
    category?: Category;
    sector?: Sectors;
    organisationName?: string;
}): Metadata {
    // Organisation page
    if (organisationName) {
        return createMetadata({
            title: organisationName,
            description: `Bekijk de afhankelijkheid van ${organisationName} op Zijn we al autonoom.`,
        });
    }

    if (!dataset) {
        throw new Error('Either organisationName or dataset must be provided');
    }

    const datasetLabel = getDatasetLabel(dataset);

    // Sector page (most specific)
    if (sector && category) {
        const sectorLabel = getSectorLabel(sector);
        const categoryLabel = getCategoryLabel(category);
        return createMetadata({
            title: `${sectorLabel} — ${categoryLabel}`,
            description: createDependencyDescription(sectorLabel.toLowerCase(), datasetLabel.toLowerCase()),
        });
    }

    // Category page
    if (category) {
        const categoryLabel = getCategoryLabel(category);
        return createMetadata({
            title: `${categoryLabel} — ${datasetLabel}`,
            description: createDependencyDescription(categoryLabel.toLowerCase(), datasetLabel.toLowerCase()),
        });
    }

    // Dataset page (least specific)
    return createMetadata({
        title: `${datasetLabel} infrastructuur`,
        description: createDependencyDescription('Nederlandse organisaties', datasetLabel.toLowerCase()),
    });
}

export function createMapMetadata(dataset?: DestinationDataset): Metadata {
    if (!dataset) {
        return createMetadata({
            title: 'Kaart',
            description: 'Bekijk op de kaart waar Nederlandse organisaties hun digitale infrastructuur hosten.',
        });
    }

    const label = getDatasetLabel(dataset);
    return createMetadata({
        title: `Kaart — ${label}`,
        description: createDependencyDescription('Nederlandse organisaties', label.toLowerCase()),
    });
}

