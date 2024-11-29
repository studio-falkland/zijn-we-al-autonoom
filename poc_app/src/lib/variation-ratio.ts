function calculateVariationRatio(data) {
    // Step 1: Calculate frequencies
    const frequencies = {};
    data.forEach(item => {
        frequencies[item] = (frequencies[item] || 0) + 1;
    });

    // Step 2: Find modal category frequency
    const modalFrequency = Math.max(...Object.values(frequencies));

    // Step 3: Calculate total observations
    const totalObservations = data.length;

    // Step 4: Compute Variation Ratio
    const variationRatio = 1 - (modalFrequency / totalObservations);

    return variationRatio;
}