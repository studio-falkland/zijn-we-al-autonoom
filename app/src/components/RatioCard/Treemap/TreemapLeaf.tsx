import { HierarchyRectangularNode } from 'd3';
import { MeasurementFrequency } from './queries';
import { ComponentPropsWithRef, CSSProperties, HTMLAttributes, MouseEvent, PropsWithRef, Ref, useCallback, useMemo } from 'react';
import { getEmojiForCountryCode } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { PatternMatcher, US_AS } from './patterns';
import { useRedButton } from '@/components/RedButton/context';

const PATTERNS = [
    '/Pattern=Amazon.svg',
    '/Pattern=EU.svg',
    '/Pattern=Google.svg',
    '/Pattern=Microsoft.svg',
    '/Pattern=Other.svg',
    '/Pattern=USA.svg',
];

export type TreemapLeafHoverData = {
    data: MeasurementFrequency;
    rect: DOMRect;
}

export interface TreemapLeafProps {
    leaf: HierarchyRectangularNode<MeasurementFrequency>;
    onHover: (data: TreemapLeafHoverData) => void;
    onHoverOut: () => void;
}

export interface TreemapLeafLabelProps {
    frequency: MeasurementFrequency;
}

export function TreemapLeafLabel({ frequency }: TreemapLeafLabelProps) {
    return (
        <span className="truncate inline-block box-shadow-zwaa-small border rounded border-blue-900 p-2 bg-white">
            {getEmojiForCountryCode(frequency.as_country_code)}
            {' '}
            {frequency.category}
            {' '}
            ({(frequency.ratio * 100).toFixed(1)}%)
        </span>
    )
}

export default function TreemapLeaf({ leaf, onHover, onHoverOut }: TreemapLeafProps) {
    const [isRedButtonActive] = useRedButton();

    const handleHover = useCallback((e: MouseEvent<SVGGElement>) => {
        onHover({ data: leaf.data, rect: e.currentTarget.getBoundingClientRect() });
    }, [leaf, onHover]);

    const pattern = useMemo(() => PatternMatcher(leaf.data), [leaf]);

    const fill = useMemo(() => (
        isRedButtonActive && (
            leaf.data.as_country_code === 'US' || (
                leaf.data.asn && US_AS.includes(leaf.data.asn)
            )
        ) ? '#FF0000' : '#0000FF'
    ), [isRedButtonActive, leaf.data])



    return (
        <g
            key={leaf.data.category}
            onMouseEnter={handleHover}
            onMouseLeave={onHoverOut}
        >
            <rect
                x={leaf.x0}
                width={leaf.x1 - leaf.x0}
                y={leaf.y0}
                height={leaf.y1 - leaf.y0}
                fill="#F6F6FF"
                rx={4}
            />
            <rect
                x={leaf.x0}
                width={leaf.x1 - leaf.x0}
                y={leaf.y0}
                height={leaf.y1 - leaf.y0}
                mask={pattern}
                fill={fill}
                rx={4}
            />
            <foreignObject
                x={leaf.x0}
                width={leaf.x1 - leaf.x0}
                y={leaf.y0}
                height={leaf.y1 - leaf.y0}
            >
                <div className="p-4">
                    <TreemapLeafLabel frequency={leaf.data} />
                </div>
            </foreignObject>
        </g>
    )
}