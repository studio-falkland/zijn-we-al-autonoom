import { Category, DestinationDataset, Region, Sectors } from '@are-we-dependent/data';
import { ArrowRight } from 'lucide-react';
import { getFrequencySet } from './Treemap/queries';
import Treemap from './Treemap';
import Concentration from './Concentration';
import Link from 'next/link';
import { getCategoryLabel, getDatasetLabel, getRegionLabel, getSectorLabel } from '@/lib/labels';
import { getIconForCategory, getIconForDataset, getIconForRegion } from '@/lib/icons';

export interface RatioCardProps {
    region: Region,
    category: Category,
    dataset: DestinationDataset,
    sector?: Sectors,
}

export default async function RatioCard({
    region, category, dataset, sector,
}: RatioCardProps) {
    const frequencies = await getFrequencySet({ region, category, type: dataset, sector });

    const RegionIcon = getIconForRegion(region);
    const CategoryIcon = getIconForCategory(category);
    const DatasetIcon = getIconForDataset(dataset);

    const sum = frequencies.reduce((sum, f) => sum + f.frequency, 0);
    
    return (
        <Link
            className="bg-white p-4 rounded-xl border border-blue-800 box-shadow-zwaa hover:-translate-y-1 transition-transform w-full"
            href={`/${dataset}/${category}`}
        >
            <div className="flex justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <RegionIcon className="w-3 h-3" />
                        {getRegionLabel(region)}
                    </div>
                    <ArrowRight className="w-4" />
                    <div className="flex items-center gap-2">
                        <CategoryIcon className="w-3 h-3" />
                        {getCategoryLabel(category)}
                    </div>
                    {sector && (
                        <>
                            <ArrowRight className="w-4" />
                            <div className="flex items-center gap-2">
                                <CategoryIcon className="w-3 h-3" />
                                {getSectorLabel(sector)}
                            </div>
                        </>
                    )}
                    <ArrowRight className="w-4" />
                    <div className="flex items-center gap-2">
                        <DatasetIcon className="w-3 h-3" />
                        {getDatasetLabel(dataset)}
                    </div>
                    <div className="text-blue-200">
                        ({sum} organisaties)
                    </div>
                </div>
                <Concentration frequencies={frequencies} />
            </div>
            <Treemap frequencies={frequencies} />
        </Link>
    );
}