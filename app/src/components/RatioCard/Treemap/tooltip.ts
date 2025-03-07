import { offset, shift, useFloating } from '@floating-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TreemapLeafHoverData } from './TreemapLeaf';

export default function useTreemapTooltip() {
    const [tooltipData, setTooltipData] = useState<TreemapLeafHoverData | null>(null);
    const tooltipDataRef = useRef(tooltipData);
    const resetTooltip = useCallback(() => setTooltipData(null), []);

    const { refs, floatingStyles, update } = useFloating({
        placement: 'top',
        middleware: [offset(10), shift()],
        open: !!tooltipData,
        elements: {
            reference: {
                getBoundingClientRect() {
                    return tooltipDataRef?.current?.rect || {
                        x: 0,
                        y: 0,
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 0,
                        width: 0,
                        toJSON() {
                            return "{}";
                        }
                    };
                },
            } as Element,
        }
    });

    useEffect(() => {
        tooltipDataRef.current = tooltipData;
        update();
    }, [tooltipData]);

    return {
        tooltipData,
        refs, 
        floatingStyles,
        resetTooltip,
        setTooltipData
    }
}