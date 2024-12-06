export interface RIOAddress {
    type: 'Bezoekadres' | 'Postadres' | 'Woo-Adres';
    straat?: string;
    huisnummer?: string;
    postbus?: string;
    postcode: string;
    plaats: string;
    provincieAfkorting?: string;
    land?: string;
    centroideLatitude?: string;
    centroideLongitude?: string;
    centroideRdx?: string;
    centroideRdy?: string;
}

/**
 * Addresses in RIO are formatted incredibly weirdly. This code attempts to
 * structure the output from it into something parseable
 */
export default function parseAddress(input?: string): RIOAddress[] {
    // Split by semicolons to get individual addresses
    const entries = input?.split(';');

    // Map each entry into an object
    const parsedData = (entries || []).map((entry) => {
        // Split by commas to get key-value pairs
        const keyValuePairs = entry.split(', ');

        // Reduce key-value pairs into an object
        return keyValuePairs.reduce((obj, pair) => {
            const [key, value] = pair.split(':').map((s) => s.trim()); // Split by colon and trim
            obj[key] = value; // Assign key-value pair to the object
            return obj;
        }, {} as Record<string, string>);
    });

    return parsedData as unknown as RIOAddress[];
}