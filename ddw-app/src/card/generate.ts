// Generates the print PDF on-device: one document of three A7 pages — the
// personal map card first, then two identical copies of the dependency sheet.
// Produces the file with expo-print and returns its URI for the session store.

import * as Print from 'expo-print';

import type { MeasurementFrequency } from '@/data/dependencies';
import { buildDependencySheetSvg, cardFontFaces, type CardContext } from './cardHtml';
import { A7_HEIGHT_MM, A7_WIDTH_MM, INK, LABEL_FONT_SIZE, PLATE_HEIGHT, PLATE_PADDING } from './geometry';
import { buildMapCardSvg } from './mapCardHtml';

// How many copies of the dependency sheet follow the personal card.
const SHEET_COPIES = 2;

// One millimetre in points, for expo-print's page size.
const MM_PT = 72 / 25.4;

// The on-device PDF, plus how many pages WebKit produced.
export type GeneratedPdf = {
    uri: string;
    pages: number;
};

// The visitor context the print job needs: the sheet context plus the map point.
export type PrintContext = CardContext & { center: [number, number] | null };

// The document's CSS: the A7 page box (in mm, so it fills the paper regardless
// of CSS pixel density), the hard page breaks, the embedded fonts and the
// self-measuring label plate inside each tile's foreignObject.
function printCss(): string {
    return (
        cardFontFaces() +
        `@page{size:${A7_WIDTH_MM}mm ${A7_HEIGHT_MM}mm;margin:0}` +
        `html,body{margin:0;padding:0}` +
        `svg{display:block}` +
        `.page{width:${A7_WIDTH_MM}mm;height:${A7_HEIGHT_MM}mm;overflow:hidden;break-after:page;page-break-after:always}` +
        `.page:last-child{break-after:auto;page-break-after:auto}` +
        `.plate{width:100%;height:100%;padding:0 ${PLATE_PADDING}px;box-sizing:border-box;background:#fff;border-radius:4px;color:${INK};` +
        `font-family:'Familjen Grotesk';font-size:${LABEL_FONT_SIZE}px;line-height:${PLATE_HEIGHT}px;` +
        `text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`
    );
}

// The whole print document: three A7 pages, each in its own forced page break.
function buildPrintHtml(frequencies: MeasurementFrequency[], context: PrintContext): string {
    const pages = [
        buildMapCardSvg({ place: context.place, center: context.center, language: context.language }),
        ...Array.from({ length: SHEET_COPIES }, () => buildDependencySheetSvg(frequencies, context)),
    ];
    return (
        `<!doctype html><html lang="${context.language}"><head><meta charset="utf-8"/>` +
        `<style>${printCss()}</style></head><body>` +
        pages.map((svg) => `<section class="page">${svg}</section>`).join('') +
        `</body></html>`
    );
}

// Render the print HTML to an A7 PDF file in the app's cache directory.
export async function generateCardPdf(
    frequencies: MeasurementFrequency[],
    context: PrintContext,
): Promise<GeneratedPdf> {
    const html = buildPrintHtml(frequencies, context);
    const result = await Print.printToFileAsync({
        html,
        width: A7_WIDTH_MM * MM_PT,
        height: A7_HEIGHT_MM * MM_PT,
        margins: { top: 0, left: 0, right: 0, bottom: 0 },
    });
    const expected = 1 + SHEET_COPIES;
    if (result.numberOfPages !== expected) {
        console.warn(`print rendered ${result.numberOfPages} pages, expected ${expected} — check page geometry.`);
    }
    return { uri: result.uri, pages: result.numberOfPages };
}
