import { createOpenGraphImage, sanitizeText } from '@/components/OpenGraphImage';
import db from '@/lib/db';
import { getEmojiForCountryCode } from '@/lib/icons';
import { getDatasetLabel } from '@/lib/labels';
import { DestinationDataset, Measurement, Organisation } from '@are-we-dependent/data';

export const alt = 'Organisatie';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-static';

export async function generateStaticParams() {
    return db.manager.getRepository(Organisation)
        .createQueryBuilder('organisation')
        .select('slug')
        .getRawMany()
        .then((organisations) => organisations.map((organisation) => ({ slug: organisation.slug })));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await params;

        const organisation = await db.manager.getRepository(Organisation).findOne({
            where: { slug },
            relations: ['classifications', 'urls.measurements.url'],
            order: {
                urls: {
                    measurements: {
                        created_at: 'DESC',
                    },
                },
            },
        });

        if (!organisation) {
            return createOpenGraphImage({
                title: 'Organisatie niet gevonden',
            });
        }

        // Get the latest measurements for each dataset
        const allMeasurements = organisation.urls.flatMap((url) => url.measurements);
        const measurements: Measurement[] = Object.values(DestinationDataset)
            .map((dataset) => allMeasurements.find((measurement) => measurement.type === dataset))
            .filter((measurements) => measurements !== undefined);

        return createOpenGraphImage({
            title: organisation.name,
            subtitle: `De afhankelijkheid van ${organisation.name} wordt gemeten door Zijn we al autonoom?`,
            children: (
                <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
                    {measurements.map((measurement) => (
                        <div
                            key={measurement.id}
                            style={{
                                fontSize: 24,
                                color: '#0000A1',
                                lineHeight: 1.3,
                                display: 'flex',
                                flexDirection: 'column',
                                backgroundColor: 'white',
                                boxShadow: '1px 1px 0px #0000A1, 2px 2px 0px #0000A1, 3px 3px 0px #0000A1, 4px 4px 0px #0000A1',
                                border: '2px solid #0000A1',
                                borderRadius: '16px',
                                padding: '16px',
                                gap: 8,
                            }}
                        >
                            <div style={{ display: 'flex' }}>
                                <span
                                    style={{
                                        // display: 'flex',
                                        fontSize: 20,
                                        padding: 8,
                                        flexGrow: 0,
                                        alignItems: 'flex-start',
                                        backgroundColor: '#e5e5ff',
                                        borderRadius: 8,
                                        color: '#0000FF',
                                    }}
                                >
                                    {getDatasetLabel(measurement.type)}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    fontSize: 32,
                                }}
                            >
                                <span>
                                    {measurement.as_country_code && getEmojiForCountryCode(sanitizeText(measurement.as_country_code))}
                                </span>
                                <span>
                                    {measurement.as_organisation ? sanitizeText(measurement.as_organisation) : ''}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ),
        });
    } catch (error) {
        console.error('Failed to generate OG image:', error);
        // Return a fallback image instead of failing the build
        return createOpenGraphImage({
            title: 'Organisatie',
            subtitle: 'Zijn we al autonoom?',
        });
    }
}

