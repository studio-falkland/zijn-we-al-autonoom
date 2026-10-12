// Keeps the derived card data warm: whenever the selection or location changes,
// it recomputes the providers, frequencies and PDF in the background, so the
// reveal, fuse and outro screens never wait on it.

import { useEffect } from 'react';

import { useSessionStore } from '@/store/session';

// Wait for a pause in the taps before recomputing, so a burst of selections
// triggers one run rather than one per tap.
const DEBOUNCE = 250;

export function useWarmCardData() {
    const selected = useSessionStore((state) => state.selectedServices);
    const location = useSessionStore((state) => state.location);
    const refreshCardData = useSessionStore((state) => state.refreshCardData);

    useEffect(() => {
        // Nothing to compute until the visitor has gathered a service.
        if (selected.length === 0) return;
        const timer = setTimeout(() => refreshCardData(), DEBOUNCE);
        return () => clearTimeout(timer);
    }, [selected, location, refreshCardData]);
}
