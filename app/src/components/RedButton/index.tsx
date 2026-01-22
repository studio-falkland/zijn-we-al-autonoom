'use client';
import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useRedButton } from './context';
import { Power } from 'lucide-react';
import { Measurement } from '@are-we-dependent/data';

/**
 * Get the text color (CSS class) for a given measurement.
 */
export function getColorForMeasurement(measurement: Pick<Measurement, 'as_country_code'>) {
    if (measurement.as_country_code === 'US') {
        return 'text-red-500';
    }
    return 'text-blue-900';
}

export default function RedButton() {
    const [isActive, setIsActive] = useRedButton();

    const handleClick = useCallback(() => {
        setIsActive((current) => !current);
    }, []);

    return (
        <button
            onClick={handleClick}
            className={cn(
                "text-white font-bold px-4 py-2 bg-red-500 border border-red-800 hover:bg-red-600 rounded red-button cursor-pointer flex items-center gap-2",
                isActive && 'active'
            )}
        >
            <Power className="h-4 w-4" />
            <span className="hidden md:block">
                Grote rode knop
            </span>
        </button>
    );
}