// The service categories the visitor reviews after the locked-in step, in order.
//
// Each maps to a hierarchy category and carries its step's question. Keeping the
// order and copy here means adding a category (supermarkets, say) is one entry.
import { Category } from '@are-we-dependent/data';

export type ServiceCategory = {
    key: string;
    category: Category;
    question: string;
};

export const SERVICE_CATEGORIES: ServiceCategory[] = [
    {
        key: 'education',
        category: Category.Education,
        question: 'Do you or your family members use any educational facility?',
    },
    {
        key: 'healthcare',
        category: Category.Healthcare,
        question: 'Do you or your family members use any healthcare provider?',
    },
];

// The category for a route key, or undefined when the key is unknown.
export function findCategory(key: string): ServiceCategory | undefined {
    return SERVICE_CATEGORIES.find((category) => category.key === key);
}

// The next category's key in the loop, or null after the last one.
export function nextCategory(key: string): string | null {
    const index = SERVICE_CATEGORIES.findIndex((category) => category.key === key);
    const next = SERVICE_CATEGORIES[index + 1];
    return index >= 0 && next ? next.key : null;
}
