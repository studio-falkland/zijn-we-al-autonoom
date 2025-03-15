'use client';
import { useCallback } from 'react';
import { useRedButton } from './context';

export default function RedButton() {
    const [isActive, setIsActive] = useRedButton();

    const handleClick = useCallback(() => {
        setIsActive((isActive) => !isActive);
    }, []);

    return (
        <button
            onClick={handleClick}
            className="text-white font-bold px-4 py-2 bg-red-500 rounded red-button"
        >
            Grote rode knop
        </button>
    );
}