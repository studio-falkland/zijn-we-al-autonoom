// Shared fan geometry: arranges a hand of cards along a shallow arc, tilting each
// about its bottom centre so the tops fan out while the bottoms line up. Used by
// the services hand and by the reveal screen's opening fan, so the two agree.

import { Spacing } from '@/theme/tokens';

// The tightest horizontal step, so a sliver of every card stays visible.
const MIN_STEP = 12;
// The most a card may advance per step, so even a small hand overlaps.
const MAX_STEP_RATIO = 0.6;
// How far the outermost cards dip below the centre, as a fraction of the card
// width — the extra dip that makes the hand read as a fan.
const DROP_RATIO = 0.14;

// A card's slot: its top-left origin and its tilt in degrees.
export type FanSlot = { left: number; top: number; angle: number };

// The slot of each card, plus the height the hand needs for a given width.
export function fanLayout({
    count,
    width,
    cardWidth,
    cardHeight,
    maxAngle,
}: {
    count: number;
    width: number;
    cardWidth: number;
    cardHeight: number;
    maxAngle: number;
}): { height: number; slots: FanSlot[] } {
    // The arc only makes sense with more than one card and a non-zero angle.
    const usesArc = count > 1 && maxAngle > 0;
    const rad = (Math.abs(maxAngle) * Math.PI) / 180;
    const halfWidth = cardWidth / 2;

    // A tilt about the bottom centre swings the top corners out past the card's
    // own box, so inset the hand by that swing on each side to stay on screen.
    const overhang = usesArc ? cardHeight * Math.sin(rad) : 0;
    const usableWidth = Math.max(cardWidth, width - overhang * 2);

    // The horizontal step between card origins: tighter as the hand grows.
    let step = 0;
    if (count > 1) {
        const spread = (usableWidth - cardWidth) / (count - 1);
        step = Math.max(MIN_STEP, Math.min(cardWidth * MAX_STEP_RATIO, spread));
    }
    const span = cardWidth + step * Math.max(count - 1, 0);
    const leftStart = overhang + Math.max(0, (usableWidth - span) / 2);

    // The same tilt also lifts a top corner and drops a bottom corner, so reserve
    // both; and the edges dip below the centre so the hand reads as a fan.
    const topLift = usesArc ? Math.max(0, halfWidth * Math.sin(rad) - cardHeight * (1 - Math.cos(rad))) : 0;
    const bottomDrop = usesArc ? halfWidth * Math.sin(rad) : 0;
    const fanDrop = usesArc ? cardWidth * DROP_RATIO : 0;
    const height = cardHeight + topLift + bottomDrop + fanDrop + Spacing.sm;

    const middle = (count - 1) / 2;
    const slots = Array.from({ length: count }, (_, index) => {
        const angle = usesArc ? (maxAngle * (index - middle)) / middle : 0;
        const dip = usesArc ? fanDrop * (Math.abs(angle) / maxAngle) : 0;
        return { left: leftStart + index * step, top: topLift + dip, angle };
    });
    return { height, slots };
}
