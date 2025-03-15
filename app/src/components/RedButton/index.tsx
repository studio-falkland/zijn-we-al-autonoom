'use client';
import { useCallback, useState } from 'react';
import { useRedButton } from './context';
import { cn } from '@/lib/utils';

export default function RedButton() {
    // const [isActive, setIsActive] = useRedButton();
    const [isActive, setIsActive] = useState(false);

    const handleClick = useCallback(() => {
        setIsActive((current) => !current);
    }, []);

    return (
        <button
            onClick={handleClick}
            className={cn(
                "text-white font-bold px-4 py-2 bg-red-500 border border-red-800 hover:bg-red-600 rounded red-button cursor-pointer",
                isActive && 'active'
            )}
        >
            Grote rode knop
        </button>
    );
}