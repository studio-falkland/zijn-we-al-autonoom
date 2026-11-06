/**
 * Retrieve a flag emoji for a two-letter country code.
 */
export function getEmojiForCountryCode(countryCode?: string): string {
    // GUARD: Ensure the country code has a valid format
    if (!countryCode || countryCode.length !== 2) return '';

    // Convert to a UTF codepoint for that flag
    return countryCode.toUpperCase()
        .split('')
        .map((char) => String.fromCodePoint(char.charCodeAt(0) + 0x1f1a5))
        .join('');
}
