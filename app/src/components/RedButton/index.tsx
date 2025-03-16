'use client';
import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useRedButton } from './context';
import { Power } from 'lucide-react';

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
            Grote rode knop
        </button>
    );
}