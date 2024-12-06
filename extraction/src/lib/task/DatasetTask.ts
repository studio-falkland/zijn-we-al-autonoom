import BananaSlug from 'github-slugger';
import { EntityManager } from 'typeorm';
import { Task } from './index.jsx';

import Organisation from '@/models/Organisation.js';
import Dataset from '@/models/Dataset.js';
import URL from '@/models/URL.js'
import OrganisationClassification from '@/models/Classification.js';

import db from '@/db.js';
import parseURL from '@/lib/ParseURL.js';
import { OrganisationCategory, Region, Sectors } from '@/hierarchy.js';

export interface MinimumOrganisation {
    name: string;
    address?: string;
    city?: string;
    postcode?: string;
    lat?: number;
    lng?: number;
}

export interface MinimumClassification {
    region: Region,
    category: OrganisationCategory,
    sector: Sectors,
}

export interface DatasetDatum {
    organisation: MinimumOrganisation;
    url: string | null;
}

const slugger = new BananaSlug();

const alreadyProcessedDatasets = new Set();

/**
 * An enhanced task, that can be used to insert and update datasets.
 */
export default class DatasetTask extends Task {
    async retrieveAndMatchDataset(
        name: string,
        currentCacheKey: string,
        location: string,
    ) {
        if (alreadyProcessedDatasets.has(name))  {
            throw new Error(`A dataset with the name "${name}" has already been processed. Are you sure you've set a unique name for the dataset?`);
        }
        alreadyProcessedDatasets.add(name);

        // Retrieve the right dataset from the database
        let dataset = await db.manager.findOne(Dataset, { 
            where: { name },
            // Also, retrieve the organsiation currently associated with this dataset
            relations: ['organisations']}
        );

        this.log(`Expected cache key: "${dataset?.cacheKey}", current: "${currentCacheKey}"`)
        // GUARD: If the dataset exists and the cache key is still the same, we
        // can assume the dataset hasn't changed and stop updating the dataset
        if (dataset && currentCacheKey === dataset.cacheKey) {
            this.log('Cache key matches, no updates necessary.');
            return null;
            // GUARD: If the dataset doesn't exist yet, we'll need to create it.
        } else if (!dataset) {
            this.log('No dataset found, creating a new one.');
            dataset = new Dataset()
            dataset.name = name;
            dataset.cacheKey = currentCacheKey;
            dataset.source = location;
        // GUARD: If the dataset exists, but has a separate key, we'll update it
        } else {
            this.log('Dataset exists but has a different cache key.');
            dataset.cacheKey = currentCacheKey;
        }

        return dataset;
    }

    async insertOrUpdate(
        dataset: Dataset,
        data: DatasetDatum[],
        classification: MinimumClassification,
    ) {
        // Create the map that contains all current organisations
        const map = await this.generateOrganisationsMap(dataset.organisations);

        // Wrap all our database shenanigans in a transaction
        await db.transaction(async (manager) => {
            // Loop over each item that has to be inserted
            const inserts = data.map(async ({ organisation, url }) => {
                // First, upsert the organisation
                const slug = await this.upsertOrganisation(
                    manager, dataset, organisation,
                );

                // Then, upsert the classification
                await this.upsertClassification(
                    manager, slug, classification,
                );

                // Lastly, upsert the URL
                await this.upsertURL(
                    manager, slug, url,
                );

                // Now that we're done, we can delete the the organsiation from
                // the map with stale data
                map.delete(slug);

                // Also, increment the counter
                this.updateProgress((p) => p += 1);
            });

            // Now, we'll just wait for all promises to succeed
            await Promise.all(inserts);
        });

        // Lastly, update the dataset, just in case
        await db.manager.save(Dataset, dataset);

        // Clean up after any leftover organsiations
        await this.cleanupOrganisationsMap(map);
    }

    /**
     * Upsert a single organisation
     */
    async upsertOrganisation(
        manager: EntityManager,
        dataset: Dataset,
        organisation: MinimumOrganisation,
    ) {
        // Generate a slug from the organisation name
        const slug = slugger.slug(organisation.name);

        // Upsert the organisation
        await manager.createQueryBuilder()
            .insert()
            .into(Organisation)
            .values({
                ...organisation,
                slug,
                dataset,
                active: true,
            })
            .insert()
            .orUpdate(
                ['name', 'dataset', 'active'],
                ['slug'],
            )
            .returning('slug')
            .execute();

        return slug;
    }

    /**
     * Upsert a given classification for combination with a given organisation,
     * determined by the supplied slug
     */
    async upsertClassification(
        manager: EntityManager,
        slug: string,
        classification: MinimumClassification,
    ) {
        await manager.createQueryBuilder()
            .insert()
            .orIgnore()
            .into(OrganisationClassification)
            .values({
                ...classification,
                organisation: slug,
            })
            .execute();
    }

    async upsertURL(
        manager: EntityManager,
        slug: string,
        url?: string | null,
    ) {
        // GUARD: Check that the URL is valid
        const parsedUrl = parseURL(url);
        if (!parsedUrl) return;

        // Insert the URL into the database
        await manager.createQueryBuilder()
            .insert()
            .into(URL)
            .values({
                url: parsedUrl,
                organisation: slug,
            })
            .insert()
            .orUpdate(
                ['organisation'],
                ['url'],
            )
            .execute();
    }

    /**
     * Prepare a map that keeps track of all current organisations. We'll later
     * remove them if we enounter them, so we can set stale organisations to inactive.
     */
    async generateOrganisationsMap(organisations: Organisation[]) {
        // Create empty map for organisations
        const map = new Map<string, Organisation>();

        // Loop through all organisations and add them to the map
        organisations?.forEach((o) => map.set(o.slug, o));

        // Log the number of current entries
        this.log(`Retrieved current entries: ${organisations?.length} found`);

        return map;
    }

    /**
     * Remove any organisations that were already in the dataset but are not
     * currently mentioned in this version of the dataset.
     */
    async cleanupOrganisationsMap(map: Map<string, Organisation>) {
        // GUARD: Check that there are organisations left in the map
        if (!map.size) {
            this.log('All organsiations up-to-date');
            return;
        }

        this.log(`Removing ${map.size} organisations that are no longer in the dataset.`);

        // Create a database transaction
        await db.transaction(async (manager) => {
            // Loop through all remaining organisations in the map
            const queries = Array.from(map)
                .map(([, organisation]) => {
                    // Set their active state to false
                    organisation.active = false;

                    // Save the entity
                    return manager.save(Organisation, organisation);
                });

            // Make sure to wait for all queries to complete
            await Promise.all(queries);
        });
    }
}