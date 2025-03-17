import { Category, Dataset, DestinationDataset, Region } from '@are-we-dependent/data';
import { ArrowRight } from 'lucide-react';
import { getFrequencySet } from './Treemap/queries';
import Treemap from './Treemap';
import Concentration from './Concentration';
import Link from 'next/link';
import { getCategoryLabel, getDatasetLabel, getRegionLabel } from '@/lib/labels';
import { getIconForCategory, getIconForDataset, getIconForRegion } from '@/lib/icons';

export interface RatioCardProps {
    region: Region,
    category: Category,
    dataset: DestinationDataset,
}

export default async function RatioCard({
    region, category, dataset,
}: RatioCardProps) {
    const frequencies = await getFrequencySet({ region, category, type: dataset });

    const RegionIcon = getIconForRegion(region);
    const CategoryIcon = getIconForCategory(category);
    const DatasetIcon = getIconForDataset(dataset);
    
    return (
        <Link
            className="bg-white p-4 rounded-xl border border-blue-800 box-shadow-zwaa hover:-translate-y-1 transition-transform"
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
                    <ArrowRight className="w-4" />
                    <div className="flex items-center gap-2">
                        <DatasetIcon className="w-3 h-3" />
                        {getDatasetLabel(dataset)}
                    </div>
                </div>
                <Concentration frequencies={frequencies} />
            </div>
            <Treemap frequencies={frequencies} />
        </Link>
    );
}