// Display helpers for the hierarchy's sectors: a short label in the app's
// language and the icon the sprite pairs with the sector. Used everywhere a
// service is shown, so the two never drift apart.
import {
    BusinessSector,
    EducationSector,
    GovernmentSector,
    HealthcareSector,
    UtilitiesSector,
    type Sectors,
} from '@are-we-dependent/data';
import type { SvgProps } from 'react-native-svg';

import { EducationIcon, EnergyIcon, GovernmentIcon, HealthIcon, ShoppingIcon, WaterIcon } from '@/components/icons';

// A sector in the app's language (the data itself is Dutch).
const SECTOR_LABELS: Record<string, string> = {
    [GovernmentSector.Ministry]: 'Ministerie',
    [GovernmentSector.Province]: 'Provincie',
    [GovernmentSector.Municipality]: 'Gemeente',
    [GovernmentSector.WaterBoard]: 'Waterschap',
    [GovernmentSector.Other]: 'Overig',
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
    [UtilitiesSector.Power]: 'Energie',
    [UtilitiesSector.Water]: 'Drinkwater',
};

// The label for a sector, falling back to the raw value.
export function sectorLabel(sector: Sectors): string {
    return SECTOR_LABELS[sector] ?? sector;
}

// The icon sprite's documented pairing, as one component that renders the right
// icon for a sector (a static lookup, so no component is built during render).
export function SectorIcon({ sector, ...props }: { sector: Sectors } & SvgProps) {
    if (sector === UtilitiesSector.Water) return <WaterIcon {...props} />;
    if (sector === UtilitiesSector.Power) return <EnergyIcon {...props} />;
    if (sector.startsWith('healthcare_')) return <HealthIcon {...props} />;
    if (sector.startsWith('education_')) return <EducationIcon {...props} />;
    if (sector === BusinessSector.Largest) return <ShoppingIcon {...props} />;
    return <GovernmentIcon {...props} />;
}
