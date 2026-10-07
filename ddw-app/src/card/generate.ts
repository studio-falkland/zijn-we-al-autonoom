// Generates the A7 card PDF on-device from the visitor's dependency breakdown.
// Produces the file with expo-print and returns its URI for the session store;
// actual delivery to the printer (AirPrint/IPP) happens in Phase 3.

import * as Print from 'expo-print';

import type { MeasurementFrequency } from '@/data/dependencies';
import { A7_HEIGHT, A7_WIDTH, buildCardHtml, type CardContext } from './cardHtml';

// The on-device PDF, plus how many pages WebKit produced (should be 1).
export type GeneratedPdf = {
    uri: string;
    pages: number;
};

// Render the A7 HTML to a PDF file in the app's cache directory.
export async function generateCardPdf(
    frequencies: MeasurementFrequency[],
    context: CardContext,
): Promise<GeneratedPdf> {
    const html = buildCardHtml(frequencies, context);
    const result = await Print.printToFileAsync({
        html,
        width: A7_WIDTH,
        height: A7_HEIGHT,
        margins: { top: 0, left: 0, right: 0, bottom: 0 },
    });
    if (result.numberOfPages !== 1) {
        console.warn(`A7 card rendered ${result.numberOfPages} pages — check page geometry.`);
    }
    return { uri: result.uri, pages: result.numberOfPages };
}