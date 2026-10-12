// The service categories the visitor reviews after the locked-in step, in order.
//
// Each maps to a hierarchy category and carries the message key of its step's
// question, so the copy itself lives (translated) in the i18n dictionaries.
import { Category } from '@are-we-dependent/data';

import type { MessageKey } from '@/i18n';

export type ServiceCategory = {
    key: string;
    category: Category;
    questionKey: MessageKey;
};

export const SERVICE_CATEGORIES: ServiceCategory[] = [
    {
        key: 'education',
        category: Category.Education,
        questionKey: 'categories.education',
    },
    {
        key: 'healthcare',
        category: Category.Healthcare,
        questionKey: 'categories.healthcare',
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
