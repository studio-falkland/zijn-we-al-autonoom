import { Building2, CircleHelp, GraduationCap, Hospital, Landmark, LucideIcon, PiggyBank, Shield } from 'lucide-react';

export type Groups = 'government' | 'financial' | 'defense' | 'education' | 'healthcare' | 'business' | 'other'

const mapCategoryToGroup: Record<string, Groups> = {
    'rio-organisatieonderdeel': 'government',
    'rio-hoog college van staat': 'government',
    'rio-agentschap': 'government',
    'rio-rechtspraak': 'government',
    'rio-ministerie': 'government',
    'rio-gemeente': 'government',
    'rio-adviescollege': 'government',
    'rio-inspectie': 'government',
    'rio-politie': 'government',
    'rio-openbaar lichaam voor beroep en bedrijf': 'government',
    'rio-regionaal samenwerkingsorgaan': 'government',
    'rio-zelfstandig bestuursorgaan': 'government',
    'rio-organisatie met overheidsbemoeienis': 'government',
    'rio-brandweer': 'government',
    'rio-provincies': 'government',
    'rio-waterschap': 'government',
    'rio-waterschappen': 'government',
    'rio-gemeenten': 'government',
    'rio-ministeries': 'government',
    'elsevier_500': 'business',
    'bb_cyber': 'business',
    'bb_political_parties': 'government',
    'bb_vital_finance_bank_eer_dutch_market': 'financial',
    'bb_healthcare_ggd': 'healthcare',
    'bb_healthcare_ggz': 'healthcare',
    'bb_vital_finance_bank_deposit_guarantee': 'financial',
    'bb_vital_finance_payment_processing': 'financial',
    'bb_vital_energy': 'business',
    'bb_healthcare_hospital': 'healthcare',
    'bb_healthcare': 'healthcare',
};

export const mapGroupsToCategories = Object.entries(mapCategoryToGroup).reduce((sum, [key, value]) => {
    if (!sum[value]) sum[value] = [];
    sum[value].push(key);
    return sum;
}, {} as Record<Groups, string[]>);

export const groupMap: Record<Groups, { name: string; id: string; icon: LucideIcon }> = {
    'business': { name: 'Business', id: 'business', icon: Building2 },
    'defense': { name: 'Defense', id: 'defense', icon: Shield },
    'education': { name: 'Education', id: 'education', icon: GraduationCap },
    'financial': { name: 'Financial', id: 'financial', icon: PiggyBank },
    'government': { name: 'Government', id: 'government', icon: Landmark },
    'healthcare': { name: 'Healthcare', id: 'healthcare', icon: Hospital },
    'other': { name: 'Other', id: 'other', icon: CircleHelp },
}

export function getGroupForCategory(category: string) {
    return mapCategoryToGroup[category] || 'other';
}

export function getLabelForGroup(group: Groups) {
    return groupMap[group] ? groupMap[group].name : groupMap.other.name;
}

export function getIconForGroup(group: Groups) {
    return groupMap[group] ? groupMap[group].icon : groupMap.other.icon;
}