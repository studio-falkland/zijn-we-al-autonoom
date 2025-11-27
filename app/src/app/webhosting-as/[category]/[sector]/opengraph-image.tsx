import { createOpenGraphImage } from '@/components/OpenGraphImage';
import { Category, Sectors, flatHierarchy } from '@are-we-dependent/data';
import { getSectorLabel } from '@/lib/labels';

export const alt = 'Webhosting infrastructuur';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-static';

export async function generateStaticParams() {
    return flatHierarchy
        .filter((instance) => instance !== undefined)
        .map((instance) => ({
            category: instance.category,
            sector: instance.sector,
        }));
}

export default async function Image({ 
    params 
}: { 
    params: Promise<{ category: Category; sector: Sectors }> 
}) {
    const { sector } = await params;
    const sectorLabel = getSectorLabel(sector);

    return createOpenGraphImage({
        title: sectorLabel,
        subtitle: 'Webhosting',
    });
}

