// Generates the print PDF on-device: one document of three A7 cards — the
// personal map card first, then two identical copies of the dependency sheet.
// Each card is laid out on a 4×6" page (the printer's closest supported size)
// and the physical A7 stock is fed under a 4×6 job. Produces the file with
// expo-print and returns its URI for the session store.

import * as Print from 'expo-print';

import type { MeasurementFrequency } from '@/data/dependencies';
import { buildDependencySheetSvg, cardFontFaces, type CardContext } from './cardHtml';
import { A7_HEIGHT_MM, A7_WIDTH_MM, INK, LABEL_FONT_SIZE, PLATE_HEIGHT, PLATE_PADDING } from './geometry';
import { buildMapCardSvg } from './mapCardHtml';

// How many copies of the dependency sheet follow the personal card.
const SHEET_COPIES = 2;

// One millimetre in points, for expo-print's page size.
const MM_PT = 72 / 25.4;

// The page the job is rendered at: 4×6" (10×15 cm), the printer's closest
// supported size. The A7 card sits inside it; the A7 stock is fed as 4×6.
const PAGE_WIDTH_MM = 101.6;
const PAGE_HEIGHT_MM = 152.4;

// Where the A7 footprint sits on the 4×6 page, in mm from its top-left corner.
// These are the tuning knobs: nudge them until the print lands on the A7 stock.
const CARD_LEFT_MM = 13.8; // (101.6 − 74) / 2 — centred on the paper
const CARD_TOP_MM = 0; // flush to the paper's leading edge

// Blank margin kept around the A7 artwork so the printer's non-printable edge
// cannot clip it. Raise this if the print still cuts into the card.
const CARD_PADDING_MM = 1;

// The artwork drawn inside the padded footprint, kept centred on the same point
// as the unpadded A7 footprint, so the offsets above stay valid.
const CARD_WIDTH_MM = A7_WIDTH_MM - CARD_PADDING_MM * 2;
const CARD_HEIGHT_MM = A7_HEIGHT_MM - CARD_PADDING_MM * 2;

// The on-device PDF, plus how many pages WebKit produced.
export type GeneratedPdf = {
    uri: string;
    pages: number;
};

// The visitor context the print job needs: the sheet context plus the map point.
export type PrintContext = CardContext & { center: [number, number] | null };

// The document's CSS: the 4×6 page box (in mm, so it is exact whatever the CSS
// pixel density), the A7 card inset by CARD_PADDING_MM, the hard page breaks,
// the embedded fonts and the self-measuring label plate inside each tile.
function printCss(): string {
    return (
        cardFontFaces() +
        `@page{size:${PAGE_WIDTH_MM}mm ${PAGE_HEIGHT_MM}mm;margin:0}` +
        `html,body{margin:0;padding:0}` +
        `svg{display:block}` +
        `.page{position:relative;width:${PAGE_WIDTH_MM}mm;height:${PAGE_HEIGHT_MM}mm;overflow:hidden;break-after:page;page-break-after:always}` +
        `.page:last-child{break-after:auto;page-break-after:auto}` +
        `.page>svg{position:absolute;left:${CARD_LEFT_MM + CARD_PADDING_MM}mm;top:${CARD_TOP_MM + CARD_PADDING_MM}mm;width:${CARD_WIDTH_MM}mm;height:${CARD_HEIGHT_MM}mm}` +
        `.plate{width:100%;height:100%;padding:0 ${PLATE_PADDING}px;box-sizing:border-box;background:#fff;border-radius:4px;color:${INK};` +
        `font-family:'Familjen Grotesk';font-size:${LABEL_FONT_SIZE}px;line-height:${PLATE_HEIGHT}px;` +
        `text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`
    );
}

// The whole print document: one A7 card per 4×6 page, each in a forced break.
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

// Render the print HTML to a 4×6 PDF file in the app's cache directory.
export async function generateCardPdf(
    frequencies: MeasurementFrequency[],
    context: PrintContext,
): Promise<GeneratedPdf> {
    const html = buildPrintHtml(frequencies, context);
    const result = await Print.printToFileAsync({
        html,
        width: PAGE_WIDTH_MM * MM_PT,
        height: PAGE_HEIGHT_MM * MM_PT,
        margins: { top: 0, left: 0, right: 0, bottom: 0 },
    });
    const expected = 1 + SHEET_COPIES;
    if (result.numberOfPages !== expected) {
        console.warn(`print rendered ${result.numberOfPages} pages, expected ${expected} — check page geometry.`);
    }
    return { uri: result.uri, pages: result.numberOfPages };
}
