import { Organisation } from '@are-we-dependent/data';
import db from '@/lib/db';
import { notFound } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getEmojiForCountryCode } from '@/lib/icons';

export async function generateStaticParams() {
    return db.manager.getRepository(Organisation)
        .createQueryBuilder('organisation')
        .select('slug')
        .getRawMany()
        .then((organisations) => organisations.map((organisation) => ({ slug: organisation.slug })));
}

export default async function OrganisationPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const organisation = await db.manager.getRepository(Organisation)
        .findOne({ where: { slug }, relations: ['classifications', 'url.measurements'] });

    if (!organisation) {
        return notFound();
    }

    return (
        <div>
            <h1 className="text-4xl font-bold">{organisation.name}</h1>
            <h2 className="text-2xl font-bold">Measurements</h2>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>URL</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Measurement Type</TableHead>
                        <TableHead>Measurement</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {organisation.url.measurements.map((measurement) => (
                        <TableRow key={measurement.id}>
                            <TableCell>{organisation.url.url}</TableCell>
                            <TableCell>{measurement.created_at.toLocaleString('nl-NL')}</TableCell>
                            <TableCell>{measurement.type}</TableCell>
                            <TableCell>
                                {measurement.as_country_code ? (
                                    <>
                                        <span className="mr-2">{getEmojiForCountryCode(measurement.as_country_code)}</span>
                                        {measurement.as_organisation}
                                    </>
                                ) : (
                                    <span className="text-gray-500">{measurement.data}</span>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}