'use server'
import { Category, DestinationDataset, Region } from '@are-we-dependent/data';
import { ArrowRight } from 'lucide-react';
import { getAggregateFrequency, getFrequencySet, getMeasurementFrequency } from './queries';
import Treemap from './TreeMap';
import calculateHHI from '@/lib/hhi';
import Concentration from './Concentration';

export interface RatioCardProps {
    region: Region,
    category: Category,
    dataset: DestinationDataset,
}

export default async function RatioCard({
    region, category, dataset,
}: RatioCardProps) {
    const frequencies = await getFrequencySet({ region, category, type: dataset });
    
    return (
        <div className="bg-white p-4 rounded-xl border border-blue-800 box-shadow-zwaa">
            <div className="flex justify-between">
                <div className="flex items-center gap-3">
                    <div>
                        {region}
                    </div>
                    <ArrowRight className="w-4" />
                    <div>
                        {category}
                    </div>
                    <ArrowRight className="w-4" />
                    <div>
                        {dataset}
                    </div>
                </div>
                <Concentration frequencies={frequencies} />
            </div>
            <Treemap frequencies={frequencies} />
        </div>
    );
}