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
