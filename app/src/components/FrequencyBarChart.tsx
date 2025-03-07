'use client';
import { Frequency } from '@/lib/hhi';
import useMeasure from '@/lib/useMeasure';
import { scaleLinear } from '@visx/scale';
import { useTooltip, useTooltipInPortal } from '@visx/tooltip';
import { MouseEvent, useCallback, useMemo } from 'react';
import { localPoint } from '@visx/event';

const DEFAULT_WIDTH = 150;
const HEIGHT = 60;
const MIN_GROUPS = 3;
const MIN_GROUP_FRACTION = 0.05;

const COLORS = [
    '#0000ff',
    '#0c0eff',
    '#2f45ff',
    '#5676ff',
    '#85a8ff',
    '#b3ccff',
    '#F1F1F8',
    '#F1F1F8',
    '#F1F1F8',
    '#F1F1F8',
];

export default function FrequencyBarChart({ frequencies }: { frequencies: Frequency[] }) {
    const [ref, { width }] = useMeasure<HTMLDivElement>();

    const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, showTooltip, hideTooltip } = useTooltip<string>();
    const { containerRef, TooltipInPortal } = useTooltipInPortal({ detectBounds: true, scroll: true });

    const handleMouseOver = useCallback((event: MouseEvent<SVGGElement>, datum: string) => {
        const coords = localPoint(event.currentTarget.ownerSVGElement!, event);
        showTooltip({ tooltipLeft: coords?.x, tooltipTop: coords?.y, tooltipData: datum });
    }, [showTooltip]);

    const total = useMemo(() => frequencies.reduce((acc, { frequency }) => acc + frequency, 0), [frequencies]);

    const scale = useMemo(() => (
        scaleLinear({
            domain: [0, total],
            range: [0, width || DEFAULT_WIDTH],
        })
    ), [total, width]);

    const data = useMemo(() => {
        const others: Frequency = { category: 'Others', frequency: 0, ratio: 0 };
        const filteredFrequencies = frequencies.filter((f, i) => {
            if (i >= MIN_GROUPS && f.ratio < MIN_GROUP_FRACTION) {
                others.frequency += f.frequency;
                others.ratio += f.ratio;
                return false
            }

            return true;
        });

        if (others.frequency > 0) {
            filteredFrequencies.push(others);
        }

        return filteredFrequencies;
    }, [frequencies]);

    return (
        <div ref={ref}>
            <svg
                width={width || DEFAULT_WIDTH}
                height={HEIGHT}
                className="border rounded"
                ref={containerRef}
            >
                {(() => {
                    let pos = 0;
                    return data.map(({ frequency, category, ratio }, i) => {
                        pos += scale(frequency);
                        return (
                            <g onMouseOver={(e) => handleMouseOver(e, category)} onMouseOut={hideTooltip} key={i}>
                                <rect
                                    fill={COLORS[i]}
                                    x={pos - scale(frequency)}
                                    width={scale(frequency)}
                                    y={0}
                                    height={HEIGHT}
                                />
                                <text
                                    className="fill-white font-heading text-xl"
                                    x={pos - (scale(frequency) / 2)}
                                    y="50%"
                                    width={scale(frequency)}
                                    height={HEIGHT}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                >
                                    <tspan className="text-ellipsis">{category.slice(0, Math.exp(scale(frequency) / 112))}…</tspan>
                                    <tspan> ({(ratio * 100).toFixed(1)}%)</tspan>
                                </text>
                                <title>{category}</title>
                            </g>
                        )
                    })
                })()}
            </svg>
            {tooltipOpen && (
                <TooltipInPortal
                    key={Math.random()}
                    top={tooltipTop}
                    left={tooltipLeft}
                >
                    <div className="text-xl bg-white border rounded">
                        {tooltipData}
                    </div>
                </TooltipInPortal>
            )}
        </div>
    );
}