import { calculateHHIFromFrequencies, Frequency } from '@/lib/hhi';
import { Droplet, Droplets } from 'lucide-react';

const getIcon = (hhi: number) => {
    if (hhi > 0.6) return <Droplet className="w-4" />;
    return <Droplets className="w-4" />;
}

const getLabel = (hhi: number) => {
    if (hhi >= 5000) return "Monopolie";
    if (hhi >= 4000) return "Oligopolie";
    if (hhi >= 2500) return "Hoge concentratie";
    if (hhi >= 1500) return "Matige concentratie";
    return "Competitief";
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
            {' '}
            <span className="text-blue-900/25 text-sm">
                ({hhi.toFixed(0)})
            </span>
        </div>
    )
}