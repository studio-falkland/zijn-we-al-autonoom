import { useMemo } from 'react';
import { MeasurementFrequency } from './queries';
import { Dimensions } from '@/lib/useMeasure';
import { hierarchy, treemap, treemapBinary } from 'd3';

/**
 * The cutoff percentage. Any measurement not meeting this criterium will be
 * grouped into the "Others" category.
 */
const MIN_PERCENTAGE = 0.5;

/**
 * Generate the treemap hierarchy
 */
export default function useTreemapHierarchy(
    frequencies: MeasurementFrequency[],
    dimensions: Dimensions,
) {
    const root = useMemo(() => {
        // Group small frequencies into "Other" category using an accumulator object
        const { mainCategories, other } = frequencies.reduce((acc, curr) => {
            const ratio = curr.ratio * 100;
            if (ratio >= MIN_PERCENTAGE) {
                acc.mainCategories.push(curr);
            } else {
                acc.other.frequency += curr.frequency;
                acc.other.ratio += curr.ratio;
            }
            return acc;
        }, {
            mainCategories: [] as MeasurementFrequency[],
            other: {
                category: 'Others',
                frequency: 0,
                ratio: 0,
            }
        });

        // Only add "Other" category if it has any items
        const processedFrequencies = other.frequency > 0
            ? [...mainCategories, other]
            : mainCategories;

        // Define the single root leaf
        const root = {
            category: 'root',
            children: processedFrequencies,
            frequency: 0,
            ratio: 0
        };

        // Morph all data into a hierchical format with the root leaf
        const data = hierarchy<MeasurementFrequency | typeof root>(root)
            .sum((d) => d.frequency || 0)
            .sort((a, b) => b.data.frequency - a.data.frequency);

        // Then, generate the treemap
        return treemap<MeasurementFrequency>().tile(treemapBinary)
            .size([dimensions.width!, dimensions.height!])
            .padding(4)
            (data)
    }, [frequencies, dimensions]);

    return root;
}