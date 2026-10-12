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
import type { MessageKey } from '@/i18n';
import { useTranslation } from '@/i18n/use-translation';

// Each sector's label key in the i18n dictionaries (the data itself is Dutch).
const SECTOR_KEYS: Record<string, MessageKey> = {
    [GovernmentSector.Ministry]: 'sectors.government_ministry',
    [GovernmentSector.Province]: 'sectors.government_province',
    [GovernmentSector.Municipality]: 'sectors.government_municipality',
    [GovernmentSector.WaterBoard]: 'sectors.government_water_board',
    [GovernmentSector.Other]: 'sectors.government_other',
    [HealthcareSector.Hospital]: 'sectors.healthcare_hospital',
    [HealthcareSector.Pharmacy]: 'sectors.healthcare_pharmacy',
    [HealthcareSector.Dentist]: 'sectors.healthcare_dentist',
    [HealthcareSector.Physiotherapist]: 'sectors.healthcare_physiotherapist',
    [HealthcareSector.NursingHome]: 'sectors.healthcare_nursing_home',
    [HealthcareSector.Other]: 'sectors.healthcare_other',
    [EducationSector.Daycare]: 'sectors.education_daycare',
    [EducationSector.Primary]: 'sectors.education_primary',
    [EducationSector.Secondary]: 'sectors.education_secondary',
    [EducationSector.Higher]: 'sectors.education_higher',
    [UtilitiesSector.Power]: 'sectors.utilities_power',
    [UtilitiesSector.Water]: 'sectors.utilities_water',
};

// A sector's label in the visitor's language, falling back to the raw value.
export function useSectorLabel() {
    const { t } = useTranslation();
    return (sector: Sectors) => {
        const key = SECTOR_KEYS[sector];
        return key ? t(key) : sector;
    };
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
