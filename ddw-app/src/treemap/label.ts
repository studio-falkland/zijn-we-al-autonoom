// Shared leaf-label rules for the treemap artwork.
// Used by both the react-native-svg screen renderer and the print card HTML so
// the card on screen and the card on paper agree about labels.

import type { MeasurementFrequency } from '@/data/dependencies';

// The label pinned to a leaf: its category and share, matching the web app.
// Every leaf gets one; tiles that are too small simply clip the text.
export function frequencyLabelText(frequency: MeasurementFrequency): string {
    return `${frequency.category} (${(frequency.ratio * 100).toFixed(1)}%)`;
}

// The single label the refined card keeps: the largest provider's name only.
export function frequencyLabelName(frequency: MeasurementFrequency): string {
    return frequency.category;
}

// The approximate advance of one character as a fraction of the font size; SVG
// cannot measure text at build time, so the truncation point is an estimate and
// an ellipsis marks the cut.
const LABEL_CHAR_RATIO = 0.542;

// Truncate a provider name to fit the given width at the given font size, ending
// with an ellipsis.
export function truncateLabel(label: string, availableWidth: number, fontSize: number): string {
    const maxChars = Math.max(1, Math.floor(availableWidth / (LABEL_CHAR_RATIO * fontSize)));
    return label.length <= maxChars ? label : `${label.slice(0, maxChars - 1)}…`;
}
