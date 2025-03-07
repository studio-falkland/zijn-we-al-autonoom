export interface Frequency {
    category: string;
    frequency: number;
    ratio: number;
}

/**
 * Calculate the Herfindahl-Hirschman Index for a given array of data.
  * @param {Array} data - The data to be analyzed.
  * @param {(row: T) => string | number} accessor - A function that returns the value to be used in the calculation.
 */
export default function calculateHHI<T>(
    data: T[],
    accessor: (row: T) => string | number
) {
    // Prepare an object to receive the frequencies
    const frequencies: Record<string, number> = {};

    // Loop through all rows in the incoing data
    data.forEach((row) => {
        // Retrieve the category for the row
        const category = accessor(row);

        // Increase the frequency of that category by one
        frequencies[category] = (frequencies[category] || 0) + 1;
    });

    // Find the frequency for the modal category
    const modalFrequency = Math.max(...Object.values(frequencies));

    // Calculate the variation ratio
    const variationIndex = ((1 - (modalFrequency / data.length)) * 100);

    // Sort all frequencies in descending order
    const sortedFrequencies: Frequency[] = Object.entries(frequencies)
        .sort((a, b) => b[1] - a[1])
        .map(([category, frequency]) => ({
            category,
            frequency,
            ratio: frequency / data.length
        }));

    const hhi = sortedFrequencies.reduce((sum, { ratio }) => (
        sum + Math.pow(ratio, 2)
    ), 0);

    const inverseHHI = ((1 - hhi) * 100);

    return {
        frequencies,
        sortedFrequencies,
        variationIndex,
        hhi,
        inverseHHI
    }
}

export function calculateHHIFromFrequencies(data: Frequency[]) {
    return data.reduce((sum, { ratio, category }) => {
        if (category === 'other') return sum;
        return sum + Math.pow(100 * ratio, 2);
    }, 0);
}