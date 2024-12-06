'use client';
import { Frequency } from '@/lib/hhi';
import useMeasure from '@/lib/useMeasure';
import { scaleLinear, scaleOrdinal } from '@visx/scale';
import { useMemo } from 'react';

const DEFAULT_WIDTH = 150;
const HEIGHT = 60;
const MIN_GROUPS = 3;
const MIN_GROUP_FRACTION = 0.2;

const COLORS = [
    '#0000ff',
    // '#0c0eff',
    '#2f45ff',
    // '#5676ff',
    '#85a8ff',
    '#b3ccff',
    '#F1F1F8',
];

export default function FrequencyBarChart({ frequencies }: { frequencies: Frequency[] }) {
    const [ref, { width }] = useMeasure<HTMLDivElement>();

    const total = useMemo(() => frequencies.reduce((acc, { frequency }) => acc + frequency, 0), []);

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
            >
                {(() => {
                    let pos = 0;
                    return data.map(({ frequency, category, ratio }, i) => {
                        pos += scale(frequency);
                        return (
                            <g key={category}>
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
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                >
                                    {category} ({(ratio * 100).toFixed(1)}%)
                                </text>
                            </g>
                        )
                    })
                })()}
            </svg>
        </div>
    );
}