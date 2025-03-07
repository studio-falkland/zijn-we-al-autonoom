'use client';
import useMeasure from '@/lib/useMeasure';
import { MeasurementFrequency } from './queries';
import { FloatingPortal } from '@floating-ui/react';
import TreemapLeaf, { TreemapLeafLabel } from './TreemapLeaf';
import useTreemapHierarchy from './hierarchy';
import useTreemapTooltip from './tooltip';
import TreemapPatterns from './patterns';

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
                <TreemapPatterns />
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