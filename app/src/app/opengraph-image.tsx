import { createOpenGraphImage } from '@/components/OpenGraphImage';

export const alt = 'Zijn we al autonoom?';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-static';

export default async function Image() {
    return createOpenGraphImage({
        title: 'Zijn we al autonoom?',
        subtitle: 'Zijn we al autonoom brengt in kaart van welke organisaties het internet in Nederland het meest afhankelijk is.',
    });
}

