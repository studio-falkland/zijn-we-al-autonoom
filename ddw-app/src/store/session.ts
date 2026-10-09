// In-memory visitor session store (Zustand).
// No persistence: a kiosk restart begins a fresh session.

import type { Organisation } from '@are-we-dependent/data';
import { create } from 'zustand';

// The generated A7 card, including the on-device PDF path.
export type GeneratedCard = {
    pdfUri: string;
};

// Print pipeline status for the kiosk loop.
export type PrintStatus = 'idle' | 'printing' | 'done' | 'error';

// The visitor's location: their postcode plus the tapped point it came from.
export type Location = {
    postcode: string;
    center: [number, number]; // [longitude, latitude] of the chosen point
};

// Session state and actions for a single visitor.
export type SessionState = {
    // The visitor's location, chosen in the gather section's first step.
    location: Location | null;
    selectedServices: Organisation[];
    generatedCard: GeneratedCard | null;
    printStatus: PrintStatus;
    setLocation(location: Location): void;
    toggleService(service: Organisation): void;
    setGeneratedCard(card: GeneratedCard): void;
    setPrintStatus(status: PrintStatus): void;
    resetSession(): void;
};

// The single source of truth for the visitor session.
export const useSessionStore = create<SessionState>()((set) => ({
    location: null,
    selectedServices: [],
    generatedCard: null,
    printStatus: 'idle',

    // Record the visitor's location.
    setLocation: (location) => set({ location }),

    // Toggle a service in or out of the selection, keyed by slug.
    toggleService: (service) =>
        set((state) => ({
            selectedServices: state.selectedServices.some((s) => s.slug === service.slug)
                ? state.selectedServices.filter((s) => s.slug !== service.slug)
                : [...state.selectedServices, service],
        })),

    // Store the generated card once the PDF exists on device.
    setGeneratedCard: (generatedCard) => set({ generatedCard }),

    // Track the print pipeline state.
    setPrintStatus: (printStatus) => set({ printStatus }),

    // Explicit end-of-flow action: clear the session for the next visitor.
    resetSession: () => set({ location: null, selectedServices: [], generatedCard: null, printStatus: 'idle' }),
}));
