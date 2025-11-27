import { createOpenGraphImage } from '@/components/OpenGraphImage';
import { Category } from '@are-we-dependent/data';
import { getCategoryLabel } from '@/lib/labels';

export const alt = 'Webhosting infrastructuur';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-static';

export async function generateStaticParams() {
    return Object.values(Category).map((category) => ({ category }));
}

export default async function Image({ params }: { params: Promise<{ category: Category }> }) {
    const { category } = await params;
    const categoryLabel = getCategoryLabel(category);

    return createOpenGraphImage({
        title: categoryLabel,
        subtitle: 'Webhosting',
    });
}

