import { Organisation } from '@are-we-dependent/data';
import db from '@/lib/db';
import { notFound } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getEmojiForCountryCode, getIconForCategory, getIconForDataset } from '@/lib/icons';
import { getCategoryLabel, getDatasetLabel, getSectorLabel } from '@/lib/labels';
import { groups } from 'd3-array';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ArrowRight, Calendar, LinkIcon, MapPinned } from 'lucide-react';
import Map from '@/components/Map';

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

    const groupedMeasurements = groups(organisation.url.measurements, (m) => m.type);

    const CategoryIcon = getIconForCategory(organisation.classifications[0].category);

    return (
        <div>
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Zijn we al autonoom?</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        Organisaties
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href={`/organisations/${organisation.slug}`} className="flex items-center gap-2">
                            <CategoryIcon className="w-4 h-4" />
                            {organisation.name}
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="flex md:flex-row flex-col items-grow gap-4 mb-12 mt-8">
                <div className="p-4 box-shadow-zwaa border border-blue-800 rounded-md bg-white flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <CategoryIcon className="w-4 h-4" />
                        {getCategoryLabel(organisation.classifications[0].category)}
                        <ArrowRight className="w-4 h-4" />
                        <CategoryIcon className="w-4 h-4" />
                        {getSectorLabel(organisation.classifications[0].sector)}
                    </div>
                    <h1 className="text-5xl font-bold mb-6">{organisation.name}</h1>
                    <h2 className="text-2xl flex items-center gap-3 mb-2">
                        <MapPinned className="w-6 h-6" />
                        {(organisation.address || organisation.postcode || organisation.city) ? (
                            <span>{organisation.address}, {organisation.postcode} {organisation.city}</span>
                        ) : (
                            <span className="text-gray-500">Geen adres bekend</span>
                        )}
                    </h2>
                    <h2 className="text-2xl flex items-center gap-3 mb-2">
                        <Calendar className="w-6 h-6" />
                        <span>
                            Voor het eerst gemeten op
                            {' '}
                            {organisation.url.measurements.at(-1)?.created_at.toLocaleDateString('nl-NL')}
                        </span>
                    </h2>
                    <h2 className="text-2xl flex items-center gap-3 mb-2">
                        <LinkIcon className="w-6 h-6" />
                        <a href={organisation.url.url} target="_blank" className="text-blue-500 hover:text-blue-700">
                            {organisation.url.url}
                        </a>
                    </h2>
                </div>
                <div className="rounded-md overflow-hidden border border-blue-800 box-shadow-zwaa flex-1">
                    <Map
                        data={[{
                            ...JSON.parse(JSON.stringify(organisation.url)),
                            organisation: JSON.parse(JSON.stringify(organisation)),
                        }]}
                        height={300} 
                    />
                </div>
            </div>
            <h2 className="text-2xl font-bold mb-4">Huidige status</h2>
            <div className="flex flex-wrap gap-4 w-full mb-8">
                {groupedMeasurements.map(([type, measurements]) => {
                    const DatasetIcon = getIconForDataset(type);
                    return (
                        <div key={type} className="bg-white rounded-md box-shadow-zwaa border border-blue-800 flex-1 p-4">
                            <h3 className="text-xl flex items-center gap-2 mb-2">
                                <DatasetIcon className="w-4 h-4" />
                                {getDatasetLabel(type)}
                            </h3>
                            <h1 className="text-4xl flex items-center gap-2 justify-center mb-2">
                                {getEmojiForCountryCode(measurements[0].as_country_code)}
                                <span className="ml-1">{measurements[0].as_organisation}</span>
                            </h1>
                            <p className="text-center text-gray-500">
                                De {getDatasetLabel(type)} van {organisation.name} wordt verzorgd door <span className="font-bold">{measurements[0].as_organisation}</span>. De jurisdictie van deze provider is <span className="font-bold">{measurements[0].as_country_code}</span>.
                            </p>
                        </div>
                    );
                })}
            </div>
            <h2 className="text-2xl font-bold mb-4">Alle metingen</h2>
            <p className="mb-4 text-xl">We hebben in totaal {organisation.url.measurements.length} metingen gedaan voor <span className="font-bold">{organisation.name}</span>.</p> 
            <div className="flex flex-wrap gap-4 w-full">
                {groupedMeasurements.map(([type, measurements]) => {
                    const DatasetIcon = getIconForDataset(type);
                    return (
                        <div key={type} className="bg-white rounded-md box-shadow-zwaa border border-blue-800 flex-1">
                            <h3 className="text-xl flex items-center gap-2 mb-2 p-4">
                                <DatasetIcon className="w-4 h-4" />
                                {getDatasetLabel(type)}
                            </h3>
                            <Table className="text-base">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>URL</TableHead>
                                        <TableHead>Timestamp</TableHead>
                                        <TableHead>Organisation</TableHead>
                                        <TableHead>IP</TableHead>
                                        <TableHead>ASN</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {measurements.map((measurement) => (
                                        <TableRow key={measurement.id}>
                                            <TableCell>{organisation.url.url}</TableCell>
                                            <TableCell>{measurement.created_at.toLocaleDateString('nl-NL')}</TableCell>
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
                                            <TableCell>{measurement.ip}</TableCell>
                                            <TableCell>{measurement.asn}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}