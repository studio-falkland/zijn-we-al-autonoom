import { Category } from '@are-we-dependent/data/hierarchy';
import { Building2, CircleHelp, GraduationCap, Hospital, Landmark, LucideIcon, PiggyBank, Shield } from 'lucide-react';

export const categoryIcons: Record<Category, LucideIcon> = {
    [Category.Business]: Building2,
    [Category.Defense]: Shield,
    [Category.Education]: GraduationCap,
    [Category.Financial]: PiggyBank,
    [Category.Government]: Landmark,
    [Category.Healthcare]: Hospital,
};

export function getIconForCategory(category: Category): LucideIcon {
    return categoryIcons[category] || CircleHelp;
}

export function getEmojiForCountryCode(countrycode?: string) {
    if (!countrycode) return null;
    if (countrycode.length > 2) throw new Error('Invalid country code');
    return countrycode.toUpperCase()
        .split('')
        .map((char) => String.fromCodePoint(char.charCodeAt(0) + 0x1f1a5))
        .join('');
}