// In-memory visitor session store (Zustand).
// No persistence: a kiosk restart begins a fresh session.

import { create } from 'zustand';

import {
    getDependencyFrequencies,
    getServiceProviders,
    type MeasurementFrequency,
    type ServiceProviders,
} from '@/data/dependencies';
import type { PdokDoc } from '@/data/places';
import type { SelectedService } from '@/data/services';
import { resolveUtilities, type Utilities } from '@/data/utilities';
import { DEFAULT_LANGUAGE, translate, type Language } from '@/i18n';

// The generated A7 card, including the on-device PDF path.
export type GeneratedCard = {
    pdfUri: string;
};

// Print pipeline status for the kiosk loop.
export type PrintStatus = 'idle' | 'printing' | 'done' | 'error';

// The visitor's location: the postcode, the tapped point (for the map marker)
// and the full PDOK document. The document's centroids drive the utility
// lookups, so it is stored alongside the postcode. Both the postcode and the
// document are absent when PDOK could not be reached: the tapped point alone
// still lets the visitor continue.
export type Location = {
    postcode?: string;
    center: [number, number]; // [longitude, latitude] of the chosen point
    pdok?: PdokDoc;
};

// The derived card data: the per-service providers, their combined frequencies,
// the visitor's place and the on-device PDF. Computed in the background so the
// reveal, fuse and outro screens never wait on it.
export type CardData = {
    key: string;
    providers: ServiceProviders[];
    frequencies: MeasurementFrequency[];
    place: string | null;
};

// The background card computation's state.
export type CardStatus = 'idle' | 'loading' | 'ready' | 'error';

// The signature of the inputs a CardData was computed from, so a screen only
// trusts data that matches the current selection and location.
export function cardKey(services: SelectedService[], location: Location | null): string {
    const slugs = services.map((service) => service.slug).sort().join(',');
    return `${slugs}|${location?.postcode ?? ''}`;
}

// The newest background run; earlier runs bail so their results never land.
let latestRequest = 0;

// The in-flight background run and the inputs it was started for. A repeat
// request for the same inputs joins it instead of rendering a second PDF.
let inFlight: { key: string; promise: Promise<void> } | null = null;

// Session state and actions for a single visitor.
export type SessionState = {
    // The visitor's chosen UI language, picked on the start screen.
    language: Language;
    // The visitor's location, chosen in the gather section's first step.
    location: Location | null;
    // The utility providers serving the location, resolved from the PDOK document.
    utilities: Utilities | null;
    selectedServices: SelectedService[];
    cardData: CardData | null;
    cardStatus: CardStatus;
    cardError: string | null;
    generatedCard: GeneratedCard | null;
    printStatus: PrintStatus;
    // Dev setting: preview the PDF (OS preview) instead of the print dialog.
    previewPdf: boolean;
    setLanguage(language: Language): void;
    setLocation(location: Location): void;
    setUtilities(utilities: Utilities | null): void;
    toggleService(service: SelectedService): void;
    addServices(services: SelectedService[]): void;
    refreshCardData(): Promise<void>;
    setGeneratedCard(card: GeneratedCard): void;
    setPrintStatus(status: PrintStatus): void;
    setPreviewPdf(previewPdf: boolean): void;
    resetSession(): void;
};

// The single source of truth for the visitor session.
export const useSessionStore = create<SessionState>()((set, get) => ({
    language: DEFAULT_LANGUAGE,
    location: null,
    utilities: null,
    selectedServices: [],
    cardData: null,
    cardStatus: 'idle',
    cardError: null,
    generatedCard: null,
    printStatus: 'idle',
    previewPdf: false,

    // Switch the UI language (the start screen's NL/EN tabs).
    setLanguage: (language) => set({ language }),

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

    // Recompute the derived card data in the background: the per-service
    // providers, the combined frequencies, the place, and the A7 PDF. A stale run
    // is dropped, and any failure surfaces as an error the screens show.
    refreshCardData: () => {
        const { selectedServices, location, cardData, cardStatus, language } = get();
        const key = cardKey(selectedServices, location);
        // Nothing to do when the data already matches, or a run for the same
        // inputs is already under way — so an eager call never re-renders.
        if (cardStatus === 'ready' && cardData?.key === key) return Promise.resolve();
        if (inFlight?.key === key) return inFlight.promise;

        const token = ++latestRequest;
        // Resolve the language once, so every message in this run agrees.
        const unknown = translate(language, 'card.unknown');
        set({ cardStatus: 'loading', cardError: null });

        // The run itself, kept as a promise so a duplicate request can join it.
        const run = async () => {
            try {
                const [providers, frequencies] = await Promise.all([
                    getServiceProviders(selectedServices, unknown),
                    getDependencyFrequencies(selectedServices, unknown),
                ]);
                // The place comes straight from the PDOK document held in the session.
                const place = location?.pdok?.woonplaatsnaam ?? location?.pdok?.gemeentenaam ?? null;
                if (frequencies.length === 0) throw new Error(translate(language, 'common.noMeasurements'));
                // The print document pulls in the embedded fonts, so load it lazily.
                const { generateCardPdf } = await import('@/card/generate');
                const { uri } = await generateCardPdf(frequencies, { place, center: location?.center ?? null, language });
                if (token !== latestRequest) return;
                // A freshly generated card is unprinted, so the flag resets here.
                // The print pipeline (the fuse screen) sets its own status.
                set({
                    cardData: { key, providers, frequencies, place },
                    cardStatus: 'ready',
                    generatedCard: { pdfUri: uri },
                    printStatus: 'idle',
                });
            } catch (error) {
                if (token !== latestRequest) return;
                set({
                    cardStatus: 'error',
                    cardError: error instanceof Error ? error.message : translate(language, 'card.buildError'),
                });
            }
        };

        const promise = run();
        inFlight = { key, promise };
        // Clear the marker once the run settles, so a failure can be retried.
        promise.finally(() => {
            if (inFlight?.promise === promise) inFlight = null;
        });
        return promise;
    },

    // Store the generated card once the PDF exists on device.
    setGeneratedCard: (generatedCard) => set({ generatedCard }),

    // Track the print pipeline state.
    setPrintStatus: (printStatus) => set({ printStatus }),

    // Toggle the dev preview setting (kept across visitors, cleared on restart).
    setPreviewPdf: (previewPdf) => set({ previewPdf }),

    // Explicit end-of-flow action: clear the session for the next visitor.
    // The language resets too, so the next visitor picks their own on the start.
    resetSession: () => {
        latestRequest += 1;
        inFlight = null;
        set({
            language: DEFAULT_LANGUAGE,
            location: null,
            utilities: null,
            selectedServices: [],
            cardData: null,
            cardStatus: 'idle',
            cardError: null,
            generatedCard: null,
            printStatus: 'idle',
        });
    },
}));
