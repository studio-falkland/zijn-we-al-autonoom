/**
 * Convert a duration in milliseconds into a human-readable string
 */
export default function humanizeDuration(ms: number) {
    if (ms < 0) {
        throw new Error("Duration cannot be negative");
    }

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30.44); // Average month length
    const years = Math.floor(months / 12);

    if (years > 0) {
        return `${years} year${years !== 1 ? 's' : ''}`;
    } else if (months > 0) {
        return `${months} month${months !== 1 ? 's' : ''}`;
    } else if (days > 0) {
        return `${days} day${days !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
        return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
}