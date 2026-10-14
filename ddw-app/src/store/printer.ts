// Device-level printer selection for the kiosk.
//
// This is not part of the visitor session: it lives only in memory, so a cold
// start clears it and the picker runs again. Force-closing the app is how the
// operator re-picks which printer the installation sends its cards to.

import * as Print from 'expo-print';
import { create } from 'zustand';

// The network printer the kiosk sends its jobs to. `url` is the printer's IPP
// address, which expo-print hands straight to `UIPrinter` for a dialog-free job.
export type Printer = { name: string; url: string };

// The printer state and the two actions the screens use.
export type PrinterState = {
    printer: Printer | null;
    selectPrinter(): Promise<void>;
    printPdf(uri: string): Promise<void>;
};

export const usePrinterStore = create<PrinterState>()((set, get) => ({
    printer: null,

    // Present the iOS printer picker and remember the chosen printer. A cancel
    // or failure leaves no printer set, so a later print asks again.
    selectPrinter: async () => {
        try {
            const { name, url } = await Print.selectPrinterAsync();
            set({ printer: { name, url } });
        } catch {
            set({ printer: null });
        }
    },

    // Send a PDF straight to the selected printer: with none set, ask for one
    // first, then submit without the print dialog (iOS only shows a progress
    // indicator). A missing printer after asking is a hard error for the screen.
    printPdf: async (uri) => {
        if (!get().printer) await get().selectPrinter();
        const printer = get().printer;
        if (!printer) throw new Error('No printer selected.');
        await Print.printAsync({ uri, printerUrl: printer.url });
    },
}));
