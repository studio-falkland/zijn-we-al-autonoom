import { getCacheKeyFromFile, getCacheKeyFromUrl } from '../cacheKey.js';
import DatasetTask from './DatasetTask.js';

export class RemoteDatasetTask extends DatasetTask {
    async retrieveDatasetFromURL(name: string, url: string) {
        // Retrieve the cachekey from the URL
        const { cacheKey, buffer } = await getCacheKeyFromUrl(url);
        this.log(`Retrieving dataset for URL: ${url}`);
    
        // Use that to retrieve the dataset
        const dataset = await this.retrieveAndMatchDataset(name, cacheKey, url);
    
        // GUARD: Check if the dataset is already up-to-date and doesn't need to
        // be inserted anymore.
        if (!dataset) return null;
    
        // Make extra sure we've already retrieved the data
        const data = buffer
            ? buffer
            : await fetch(url).then((response) => response.arrayBuffer());
    
        return {
            dataset,
            data
        };
    }
    
    async retrieveDatasetFromPath(name: string, path: string) {
        // Retrieve the cache key and the file
        const { cacheKey, buffer } = await getCacheKeyFromFile(path);
        this.log(`Retrieving dataset for file: ${path}`);
    
        // Use that to retrieve the dataset
        const dataset = await this.retrieveAndMatchDataset(name, cacheKey, path);
    
        // Make extra sure we've already retrieved the data
        if (!dataset) return null;
    
        return {
            dataset,
            data: buffer,
        }
    }
}