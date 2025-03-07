'use client';
import useMeasure from '@/lib/useMeasure';
import { MeasurementFrequency } from './queries';
import { FloatingPortal } from '@floating-ui/react';
import TreemapLeaf, { TreemapLeafLabel } from './TreemapLeaf';
import useTreemapHierarchy from './hierarchy';
import useTreemapTooltip from './tooltip';

export default function Treemap({ frequencies }: { frequencies: MeasurementFrequency[] }) {
    // Ascertain the dimensions of the containing div
    const [ref, dimensions] = useMeasure<HTMLDivElement>([598, 500]);

    // Generate all data in a hierarchy that can be dealth with by d3-treemap
    const root = useTreemapHierarchy(frequencies, dimensions);

    // Prepare setup for the tooltip
    const { floatingStyles, refs, resetTooltip, tooltipData, setTooltipData } = useTreemapTooltip();

    // GUARD: check if we're actually rendering any data
    if (!frequencies || frequencies.length === 0) {
        return (
            <div ref={ref} className="w-full h-[500px] flex justify-center items-center rounded-lg mt-4 overflow-hidden">
                Geen data
            </div>
        )
    }

    return (
        <div ref={ref} className="w-full h-[500px] rounded-xl mt-4 overflow-hidden">
            <svg width={dimensions.width || 0} height={dimensions.height || 0}>
                <defs>
                    <pattern id="zwaa-p1" patternUnits="userSpaceOnUse" width="4" height="4">
                        <path
                            d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2"
                            stroke="#0000FF"
                        />
                    </pattern>
                    <pattern id="zwaa-p2" patternUnits="userSpaceOnUse" width="4" height="4">
                        <path
                            d="M 3 -1 l 2 2 M -0 0 l 4 4 M -1 3 l 2 2"
                            stroke="#0000FF"
                        />
                    </pattern>
                </defs>
                {root.leaves().map((leaf, i) => (
                    <TreemapLeaf
                        key={i}
                        leaf={leaf}
                        onHover={setTooltipData}
                        onHoverOut={resetTooltip}
                    />
                ))}
            </svg>

            <FloatingPortal>
                {tooltipData && (
                    <div ref={refs.setFloating} style={floatingStyles}>
                        <TreemapLeafLabel
                            frequency={tooltipData.data}
                        />
                    </div>
                )}
            </FloatingPortal>
        </div>
    )
}