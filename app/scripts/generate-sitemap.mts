import { writeFile } from 'fs/promises';
import db, { Category, DestinationDataset, Organisation } from '@are-we-dependent/data';
import { flatHierarchy } from '@are-we-dependent/data/hierarchy';

const BASE_URL = 'https://zijnwealautonoom.nl';

interface SitemapEntry {
    url: string;
    priority: number;
    changeFreq: string;
}

function renderEntry(entry: SitemapEntry): string {
    return `  <url>
    <loc>${entry.url}</loc>
    <changefreq>${entry.changeFreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`;
}

async function generateSitemap(): Promise<void> {
    await db.initialize();

    console.log('Generating sitemap.xml...');

    // Static pages
    const staticEntries: SitemapEntry[] = [
        { url: `${BASE_URL}/`,              priority: 1.0, changeFreq: 'weekly'  },
        { url: `${BASE_URL}/email-as/`,     priority: 0.8, changeFreq: 'weekly'  },
        { url: `${BASE_URL}/webhosting-as/`,priority: 0.8, changeFreq: 'weekly'  },
        { url: `${BASE_URL}/map/`,          priority: 0.7, changeFreq: 'weekly'  },
        { url: `${BASE_URL}/map/${DestinationDataset.EmailAS}/`,      priority: 0.6, changeFreq: 'weekly' },
        { url: `${BASE_URL}/map/${DestinationDataset.WebhostingAS}/`, priority: 0.6, changeFreq: 'weekly' },
        { url: `${BASE_URL}/about/`,        priority: 0.5, changeFreq: 'monthly' },
        { url: `${BASE_URL}/sources/`,      priority: 0.5, changeFreq: 'monthly' },
    ];

    // Category-level pages for each dataset
    const categoryEntries: SitemapEntry[] = Object.values(Category).flatMap((category) => [
        { url: `${BASE_URL}/email-as/${category}/`,      priority: 0.7, changeFreq: 'weekly' },
        { url: `${BASE_URL}/webhosting-as/${category}/`, priority: 0.7, changeFreq: 'weekly' },
    ]);

    // Sector-level pages (only for categories that have sectors in the hierarchy)
    const sectorEntries: SitemapEntry[] = flatHierarchy
        .filter((instance): instance is NonNullable<typeof instance> => instance !== undefined)
        .flatMap((instance) => [
            { url: `${BASE_URL}/email-as/${instance.category}/${instance.sector}/`,      priority: 0.6, changeFreq: 'weekly' },
            { url: `${BASE_URL}/webhosting-as/${instance.category}/${instance.sector}/`, priority: 0.6, changeFreq: 'weekly' },
        ]);

    // Organisation detail pages
    const slugRows = await db.manager
        .getRepository(Organisation)
        .createQueryBuilder('organisation')
        .select('organisation.slug', 'slug')
        .getRawMany<{ slug: string }>();

    const organisationEntries: SitemapEntry[] = slugRows.map(({ slug }) => ({
        url: `${BASE_URL}/organisations/${slug}/`,
        priority: 0.5,
        changeFreq: 'weekly',
    }));

    const allEntries = [
        ...staticEntries,
        ...categoryEntries,
        ...sectorEntries,
        ...organisationEntries,
    ];

    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...allEntries.map(renderEntry),
        '</urlset>',
    ].join('\n');

    await writeFile('./public/sitemap.xml', xml, 'utf-8');

    console.log(`✅ Generated sitemap.xml:`);
    console.log(`   - Static pages:       ${staticEntries.length}`);
    console.log(`   - Category pages:     ${categoryEntries.length}`);
    console.log(`   - Sector pages:       ${sectorEntries.length}`);
    console.log(`   - Organisation pages: ${organisationEntries.length}`);
    console.log(`   - Total URLs:         ${allEntries.length}`);

    await db.destroy();
}

export default generateSitemap;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    generateSitemap().catch(console.error);
}
