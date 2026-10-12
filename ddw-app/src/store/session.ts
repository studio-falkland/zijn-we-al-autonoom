// In-memory visitor session store (Zustand).
// No persistence: a kiosk restart begins a fresh session.

import { create } from 'zustand';

import type { PdokDoc } from '@/data/places';
import type { SelectedService } from '@/data/services';
import { resolveUtilities, type Utilities } from '@/data/utilities';

// The generated A7 card, including the on-device PDF path.
export type GeneratedCard = {
    pdfUri: string;
};

// Print pipeline status for the kiosk loop.
export type PrintStatus = 'idle' | 'printing' | 'done' | 'error';

// The visitor's location: the postcode, the tapped point (for the map marker)
// and the full PDOK document. The document's centroids drive the utility
// lookups, so it is stored alongside the postcode.
export type Location = {
    postcode: string;
    center: [number, number]; // [longitude, latitude] of the chosen point
    pdok?: PdokDoc;
};

// Session state and actions for a single visitor.
export type SessionState = {
    // The visitor's location, chosen in the gather section's first step.
    location: Location | null;
    // The utility providers serving the location, resolved from the PDOK document.
    utilities: Utilities | null;
    selectedServices: SelectedService[];
    generatedCard: GeneratedCard | null;
    printStatus: PrintStatus;
    setLocation(location: Location): void;
    setUtilities(utilities: Utilities | null): void;
    toggleService(service: SelectedService): void;
    addServices(services: SelectedService[]): void;
    setGeneratedCard(card: GeneratedCard): void;
    setPrintStatus(status: PrintStatus): void;
    resetSession(): void;
};

// The single source of truth for the visitor session.
export const useSessionStore = create<SessionState>()((set, get) => ({
    location: null,
    utilities: null,
    selectedServices: [],
    generatedCard: null,
    printStatus: 'idle',

    // Record the visitor's location and resolve its utility providers. Without a
    // PDOK document there is nothing to resolve against, so utilities stay null.
    setLocation: (location) => {
        set({ location, utilities: null });
        if (!location.pdok) return;

        resolveUtilities(location.pdok)
            .then((utilities) => {
                // Ignore a resolution whose location has since been replaced.
                if (get().location === location) set({ utilities });
            })
            .catch((error) => console.error('Failed to resolve utilities', error));
    },

    // Record the resolved providers directly.
    setUtilities: (utilities) => set({ utilities }),

    // Toggle a service in or out of the selection, keyed by slug.
    toggleService: (service) =>
        set((state) => ({
            selectedServices: state.selectedServices.some((s) => s.slug === service.slug)
                ? state.selectedServices.filter((s) => s.slug !== service.slug)
                : [...state.selectedServices, service],
        })),

    // Add services that are not selected yet, keyed by slug (idempotent).
    addServices: (services) =>
        set((state) => {
            const selected = new Set(state.selectedServices.map((s) => s.slug));
            const additions = services.filter((s) => !selected.has(s.slug));
            return additions.length > 0 ? { selectedServices: [...state.selectedServices, ...additions] } : {};
        }),

    // Store the generated card once the PDF exists on device.
    setGeneratedCard: (generatedCard) => set({ generatedCard }),

    // Track the print pipeline state.
    setPrintStatus: (printStatus) => set({ printStatus }),

    // Explicit end-of-flow action: clear the session for the next visitor.
    resetSession: () =>
        set({
            location: null,
            utilities: null,
            selectedServices: [],
            generatedCard: null,
            printStatus: 'idle',
        }),
}));
