import psl from 'psl';

/**
 * Parse any form of URL (with potentially a path, subdomain, protocol,
 * whitespace) into the form hostname.tld using the PSL-list.
 * 
 * @param url - The URL to parse.
 * @returns The hostname in the form hostname.tld or null if invalid.
 */
export default function parseURL(url?: string | null): string | null {
    if (!url) {
        return null;
    }

    // Trim and normalize the input
    url = url.trim();

    // Ensure the URL has a protocol; default to http:// if missing
    if (!/^https?:\/\//i.test(url)) {
        url = `http://${url}`;
    }

    try {
        // Parse the URL
        const parsedUrl = new URL(url);

        // Extract the hostname
        const hostname = parsedUrl.hostname;

        // Use the psl library to extract the eTLD+1
        const parsedDomain = psl.parse(hostname);

        // Check if the parsing was successful and return the domain
        if (parsedDomain && !parsedDomain.error && parsedDomain.domain) {
            return parsedDomain.domain;
        }

        return null; // Return null if no valid domain could be extracted
    } catch (err) {
        // Return null for invalid URLs
        return null;
    }
}