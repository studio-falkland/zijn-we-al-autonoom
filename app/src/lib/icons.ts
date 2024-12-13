import { OrganisationCategory } from '@are-we-dependent/data';
import { Building2, CircleHelp, GraduationCap, Hospital, Landmark, LucideIcon, PiggyBank, Shield } from 'lucide-react';

export const categoryIcons: Record<OrganisationCategory, LucideIcon> = {
    [OrganisationCategory.Business]: Building2,
    [OrganisationCategory.Defense]: Shield,
    [OrganisationCategory.Education]: GraduationCap,
    [OrganisationCategory.Financial]: PiggyBank,
    [OrganisationCategory.Government]: Landmark,
    [OrganisationCategory.Healthcare]: Hospital,
};

export function getIconForCategory(category: OrganisationCategory): LucideIcon {
    return categoryIcons[category] || CircleHelp;
}