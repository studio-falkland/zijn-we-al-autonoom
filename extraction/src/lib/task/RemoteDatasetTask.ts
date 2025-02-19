import { getCacheKeyFromFile, getCacheKeyFromUrl } from '../cacheKey.js';
import DatasetTask from './DatasetTask.js';

export class RemoteDatasetTask extends DatasetTask {
    async retrieveDatasetFromURL(
        name: string,
        url: string,
        params?: RequestInit
    ) {
        // Retrieve the cachekey from the URL
        this.log(`Retrieving dataset for URL: ${url}`);

        // Use that to retrieve the dataset
        const { dataset, buffer } = await this.retrieveAndMatchDataset(
            name,
            url,
            () => getCacheKeyFromUrl(url, params)
        ) || {};

        // GUARD: Check if the dataset is already up-to-date and doesn't need to
        // be inserted anymore.
        if (!dataset) return null;

        // Make extra sure we've already retrieved the data
        const data = buffer
            ? buffer
            : await fetch(url, params)
                .then((response) => response.arrayBuffer());

        return {
            dataset,
            data,
        };
    }

    async retrieveDatasetFromPath(name: string, path: string) {
        // Retrieve the cache key and the file
        this.log(`Retrieving dataset for file: ${path}`);

        // Use that to retrieve the dataset
        const { dataset, buffer } = await this.retrieveAndMatchDataset(
            name,
            path,
            () => getCacheKeyFromFile(path)
        ) || {};

        // Make extra sure we've already retrieved the data
        if (!dataset) return null;

        return {
            dataset,
            data: buffer,
        };
    }
}
