import { cn } from '@/lib/utils';
import { scalePower } from '@visx/scale';
import { SVGProps } from 'react';

const WIDTH = 180;
const HEIGHT = 60;
const scale = scalePower({ domain: [0, 100], range: [0, WIDTH], nice: true, exponent: 6 });

export interface HHIIndicatorProps extends SVGProps<SVGSVGElement> {
    index: number;
}

export default function HHIIndicator({ index, className, ...props }: HHIIndicatorProps) {
    return (
        <svg
            width={WIDTH}
            height={HEIGHT}
            className={cn("border rounded border-blue-900 shadow-[4px_4px_0_#0000A1]", className)}
            {...props}
        >
            <defs>
                <clipPath id="text-left">
                    <rect x={0} y={0} width={scale(index)} height={HEIGHT}/>
                </clipPath>
                <clipPath id="text-right">
                    <rect x={scale(index)} y={0} width={scale(100) - scale(index)} height={HEIGHT}/>
                </clipPath>
            </defs>
            {/** Scale ticks */}
            <rect
                x={scale(99)}
                width={scale(100)}
                y={0}
                height={HEIGHT}
                className="fill-gray-300"
            />
            <rect
                x={scale(85)}
                width={scale(99) - scale(85)}
                y={0}
                height={HEIGHT}
                className="fill-gray-200"
            />
            <rect
                x={scale(75)}
                width={scale(85)}
                y={0}
                height={HEIGHT}
                className="fill-gray-100"
            />
            {/** Bar */}
            <rect
                x={0}
                width={scale(index)}
                y={0}
                height={HEIGHT}
                className="fill-blue-700"
            />
            {/** Text */}
            <text
                className="fill-white text-4xl font-semibold drop-shadow-lg font-heading"
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                clipPath="url(#text-left)"
            >
                {index.toFixed(1)}
            </text>
            <text
                className="fill-blue-700 text-4xl font-semibold drop-shadow-lg font-heading"
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                clipPath="url(#text-right)"
            >
                {index.toFixed(1)}
            </text>
        </svg>
    )
}