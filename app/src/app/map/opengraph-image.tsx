import { createOpenGraphImage } from '@/components/OpenGraphImage';

export const alt = 'Kaart';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-static';

export default async function Image() {
    return createOpenGraphImage({
        title: 'Kaart',
        subtitle: 'Geografische spreiding',
    });
}

