// The shape of a selectable service: everything the hand and the card need, plus
// the slug the selection is deduplicated and keyed on.
//
// A stored organisation satisfies it directly. The grid operators and the water
// company have no row of their own — they come from the runtime utility lookup —
// so they fill it in by name and sector instead.
import type { Category, Region, Sectors } from '@are-we-dependent/data';

export type SelectedService = {
    slug: string;
    name: string;
    classifications?: { sector: Sectors; category: Category; region: Region }[] | null;
};
