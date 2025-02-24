import calculateHHI, { calculateHHIFromFrequencies, Frequency } from '@/lib/hhi';
import { Droplet, Droplets } from 'lucide-react';

const getIcon = (hhi: number) => {
    if (hhi > 0.6) return <Droplet className="w-4" />;
    return <Droplets className="w-4" />;
}

const getLabel = (hhi: number) => {
    if (hhi > 0.6) return "Monopolie";
    if (hhi > 0.2) return "Oligopolie";
    return "Competetief";
}

export default function Concentration({ frequencies }: { frequencies: Frequency[] }) {
    if (!frequencies || frequencies.length === 0) {
        return <div>N/A</div>
    }

    const hhi = calculateHHIFromFrequencies(frequencies);

    return (
        <div className="flex items-center gap-2">
            {getIcon(hhi)}
            {getLabel(hhi)}
            ({hhi.toFixed(2)})
        </div>
    )
}