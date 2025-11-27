import { createOpenGraphImage } from '@/components/OpenGraphImage';

export const alt = 'Bronnen en Attributie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-static';

export default async function Image() {
    return createOpenGraphImage({
        title: 'Bronnen en Attributie',
        subtitle: 'Databronnen en licenties',
    });
}

