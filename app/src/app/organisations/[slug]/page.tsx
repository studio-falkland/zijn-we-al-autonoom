import { Organisation } from '@are-we-dependent/data';
import db from '@/lib/db';
import { notFound } from 'next/navigation';
import { getIconForCategory } from '@/lib/icons';
import { getCategoryLabel, getSectorLabel } from '@/lib/labels';
import { groups } from 'd3-array';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ArrowRight, Calendar, LinkIcon, MapPinned } from 'lucide-react';
import Map from '@/components/Map';
import OrganisationMeasurementTable from './components/OrganisationMeasurementTable';
import OrganisationStatus from './components/OrganisationStatus';

export async function generateStaticParams() {
    return db.manager.getRepository(Organisation)
        .createQueryBuilder('organisation')
        .select('slug')
        .getRawMany()
        .then((organisations) => organisations.map((organisation) => ({ slug: organisation.slug })));
}

export default async function OrganisationPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Fetch the organisation from the database
    const organisationEntity = await db.manager.getRepository(Organisation)
        .findOne({ where: { slug }, relations: ['classifications', 'url.measurements'] });
    
    // Convert to plain object to avoid class serialization issues
    const organisation = organisationEntity ? JSON.parse(JSON.stringify(organisationEntity)) as typeof organisationEntity : null;

    // GUARD: If the organisation is not found, return a 404
    if (!organisation) {
        return notFound();
    }

    // Group the measurements by type so we can process them accordingly
    const groupedMeasurements = groups(organisation.url.measurements, (m) => m.type);

    // Get the icon for the category
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
                        <span className="bg-blue-100 text-blue-500 px-2 py-1 rounded-md text-sm mr-2">Organisatie</span>
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
                            {new Date(organisation.url.measurements.at(-1)?.created_at || '').toLocaleDateString('nl-NL')}
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
                            ...organisation.url,
                            organisation: organisation,
                        }]}
                        height={300} 
                    />
                </div>
            </div>
            <h2 className="text-2xl font-bold mb-4">Huidige status</h2>
            <div className="flex flex-wrap gap-4 w-full mb-8">
                {groupedMeasurements.map(([type, measurements]) => (
                    <OrganisationStatus
                        key={type}
                        type={type}
                        measurement={measurements.at(0)}
                        organisation={organisation}
                    />
                ))}
            </div>
            <h2 className="text-2xl font-bold mb-4">Alle metingen</h2>
            <p className="mb-4 text-xl">We hebben in totaal {organisation.url.measurements.length} metingen gedaan voor <span className="font-bold">{organisation.name}</span>.</p> 
            <div className="flex flex-wrap gap-4 w-full">
                {groupedMeasurements.map(([type, measurements]) => (
                    <OrganisationMeasurementTable
                        key={type}
                        type={type}
                        measurements={measurements}
                        organisation={organisation}
                    />
                ))}
            </div>
        </div>
    );
}