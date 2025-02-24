import { LegacyRef, useCallback, useRef, useState } from 'react';

export interface Dimensions {
    width: null | number;
    height: null | number;
}

/**
 * Measure an element's dimensions
 * 
 * Adapted from: https://github.com/uidotdev/usehooks/blob/main/index.js
 * @author uidotdev
 * @license MIT
 */
export default function useMeasure<T extends Element>(
    defaults?: [number, number]
): [LegacyRef<T>, Dimensions] {
    const [dimensions, setDimensions] = useState<Dimensions>({
        width: defaults ? defaults[0] : null,
        height: defaults ? defaults[1] : null,
    });

    const previousObserver = useRef<ResizeObserver | null>(null);

    const customRef = useCallback((node: T) => {
        if (previousObserver.current) {
            previousObserver.current.disconnect();
            previousObserver.current = null;
        }

        if (node?.nodeType === Node.ELEMENT_NODE) {
            const observer = new ResizeObserver(([entry]) => {
                if (entry && entry.borderBoxSize) {
                    const { inlineSize: width, blockSize: height } =
                        entry.borderBoxSize[0];

                    setDimensions({ width, height });
                }
            });

            observer.observe(node);
            previousObserver.current = observer;
        }
    }, []);

    return [customRef, dimensions];
}