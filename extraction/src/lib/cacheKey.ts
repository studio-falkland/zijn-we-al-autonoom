import crypto from 'crypto';
import fs from 'fs/promises';

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export interface CacheKeyWithStream {
    buffer: ArrayBuffer;
    cacheKey: string;
}

export type CacheKeyWithOptionalStream = PartialBy<CacheKeyWithStream, 'buffer'>;

export async function getCacheKeyFromUrl(
    url: string,
    params?: RequestInit
): Promise<CacheKeyWithOptionalStream> {
    // Perform a HEAD request on the file
    const response = await fetch(url, { method: 'HEAD' });

    // GUARD: Check if the buffer was retrieved succesfully
    if (!response.ok) throw new Error(`Failed to retrieve "${url}" (${response.statusText})`);

    // GUARD: Check if the file has an ETag
    if (response.headers.has('ETag'))
        return { cacheKey: response.headers.get('etag')! };

    // GUARD: Check if the file has a last modified date
    if (response.headers.has('Last-Modified'))
        return { cacheKey: response.headers.get('Last-Modified')! };

    // If we can't determine a cache key from the headers, we'll just retrieve
    // the file
    const bufferResponse = await fetch(url, params)

    // GUARD: Check if the buffer was retrieved succesfully
    if (!bufferResponse.ok) throw new Error(`Failed to retrieve "${url}" (${response.statusText})`);

    // Parse contents into buffer
    const buffer = await bufferResponse.arrayBuffer();

    return getCacheKeyFromFile(buffer);
}

/**
 * Calculate the SHA-256 hash for a given file
 */
export async function getCacheKeyFromFile(
    file: string | ArrayBuffer,
): Promise<CacheKeyWithStream> {
    // Optionally create a read stream for the file
    const buffer = typeof file === 'string'
        ? await fs.readFile(file)
        : file;

    // Initialise the hashing pipeline
    const hash = crypto.createHash('sha256')
        .update(new Uint8Array(buffer))
        .digest('base64');

    return {
        cacheKey: hash,
        buffer,
    };
}
