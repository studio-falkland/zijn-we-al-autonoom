/**
 * Convert milliseconds to a human-readable time string.
 * @param {number} ms - The number of milliseconds to convert.
 * @returns {string} A human-readable time string in the format "HH:MM:SS".
 */
export default function convertMsToHumanTime(ms: number): string {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    // Initialize an empty string to store the human-readable time representation
    let output = "";

    // If there are any hours, convert them to a two-digit format and append "h"
    // to represent hours
    if (hours > 0) {
        output += `${hours}h`;
    }

    // If there are any minutes (excluding full hours), convert them to a
    // two-digit format and append "m" to represent minutes 
    if (minutes > 0) {
        output += ` ${minutes}m`;
    }

    // Append the remaining seconds (excluding full hours and minutes) in a
    // two-digit format, followed by "s" to represent seconds 
    output += ` ${seconds}s`;

    return output;
}
