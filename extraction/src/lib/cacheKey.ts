import crypto from 'crypto';
import fs from 'fs/promises';
import logger from './logger.js';

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
    // GUARD: Check if the method specifies a POST request, in which case the
    // HEAD request will most probably fail.
    if (!params?.method && !params?.body) {
        // Perform a HEAD request on the file
        const response = await fetch(url, { ...params, method: 'HEAD' });

        // GUARD: Check if the buffer was retrieved succesfully
        if (!response.ok) {
            logger.child({ 
                name: 'getCacheKeyFromUrl',
                data: { 
                    body: await response.text(),
                    url: url,
                    status: response.status,
                }    
            }).error('Failed to retrieve URL');
            throw new Error(`Failed to retrieve "${url}" (${response.statusText})`);
        }

        // GUARD: Check if the file has an ETag
        if (response.headers.has('ETag')) {
            return { cacheKey: response.headers.get('etag')! };
        }

        // GUARD: Check if the file has a last modified date
        if (response.headers.has('Last-Modified')) {
            return { cacheKey: response.headers.get('Last-Modified')! };
        }
    }

    // If we can't determine a cache key from the headers, we'll just retrieve
    // the file
    const bufferResponse = await fetch(url, params)

    // GUARD: Check if the buffer was retrieved succesfully
    if (!bufferResponse.ok) {
        logger.child({ 
            name: 'getCacheKeyFromUrl',
            data: { 
                body: await bufferResponse.text(),
                url: url,
                status: bufferResponse.status,
            }    
        }).error('Failed to retrieve URL');
        throw new Error(`Failed to retrieve "${url}" (${bufferResponse.statusText})`);
    }

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
