'use client';
import useMeasure from '@/lib/useMeasure';
import { useMemo } from 'react';
import { hierarchy, treemap, treemapBinary } from 'd3';
import { MeasurementFrequency } from './queries';
import { getEmojiForCountryCode } from '@/lib/icons';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

const PATTERNS = [
    '/Pattern=Amazon.svg',
    '/Pattern=EU.svg',
    '/Pattern=Google.svg',
    '/Pattern=Microsoft.svg',
    '/Pattern=Other.svg',
    '/Pattern=USA.svg',
];

export default function Treemap({ frequencies }: { frequencies: MeasurementFrequency[] }) {
    const [ref, dimensions] = useMeasure<HTMLDivElement>([598, 500]);

    const root = useMemo(() => {
        const root = { category: 'root', children: frequencies, frequency: 0, ratio: 0 };

        const data = hierarchy<MeasurementFrequency | { category: 'root', frequency: 0, ratio: 0, children: MeasurementFrequency[] }>(root)
            .sum((d) => d.frequency || 0)
            .sort((a, b) => b.data.frequency - a.data.frequency);

        return treemap<MeasurementFrequency>().tile(treemapBinary)
            .size([dimensions.width!, dimensions.height!])
            .padding(4)
            (data)
    }, [frequencies, dimensions]);

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
                    <g key={leaf.data.category}>
                        <rect
                            x={leaf.x0}
                            width={leaf.x1 - leaf.x0}
                            y={leaf.y0}
                            height={leaf.y1 - leaf.y0}
                            fill={i % 2 ? "url(#zwaa-p1)" : "url(#zwaa-p2)"}
                            style={{ backgroundImage: `url(${PATTERNS[i % PATTERNS.length]})`, backgroundRepeat: 'repeat' }}
                        />
                        <foreignObject
                            x={leaf.x0}
                            width={leaf.x1 - leaf.x0}
                            y={leaf.y0}
                            height={leaf.y1 - leaf.y0}
                            overflow="visible"
                        >
                            <Tooltip>
                                <TooltipTrigger className="w-full h-full text-left overflow-hidden hover:overflow-visible inline-block z-20">
                                    <div className="p-4 h-full">
                                        <span className="truncate inline-block box-shadow-zwaa-small border rounded border-blue-900 p-2 bg-white">
                                            {getEmojiForCountryCode(leaf.data.as_country_code)}
                                            {' '}
                                            {leaf.data.category}
                                            {' '}
                                            ({(leaf.data.ratio * 100).toFixed(1)}%)
                                        </span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {getEmojiForCountryCode(leaf.data.as_country_code)}
                                    {' '}
                                    {leaf.data.category}
                                    {' '}
                                    ({(leaf.data.ratio * 100).toFixed(1)}%)
                                </TooltipContent>
                            </Tooltip>
                        </foreignObject>
                    </g>
                ))}
            </svg>
        </div>
    )
}