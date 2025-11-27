import { createOpenGraphImage } from '@/components/OpenGraphImage';

export const alt = 'E-mail infrastructuur';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-static';

export default async function Image() {
    return createOpenGraphImage({
        title: 'E-mail infrastructuur',
        subtitle: 'Per sector in Nederland',
    });
}

