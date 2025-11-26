import OrganisationTable from '@/components/OrganisationTable';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { getIconForCategory } from '@/lib/icons';
import { getCategoryLabel, getSectorLabel } from '@/lib/labels';
import { getLatestMeasurements } from '@/lib/queries';
import { Category, DestinationDataset, Sectors } from '@are-we-dependent/data';
import { flatHierarchy } from '@are-we-dependent/data/hierarchy';
import { Mail } from 'lucide-react';
import { createPageMetadata } from '@/lib/metadata';

export interface MailSectorProps {
    params: Promise<{ category: Category, sector: Sectors }>;
}

export async function generateStaticParams() {
    return flatHierarchy
        .filter((instance) => instance !== undefined)
        .map((instance) => ({
            category: instance.category,
            sector: instance.sector,
        }));
}

export async function generateMetadata({ params }: MailSectorProps) {
    const { category, sector } = await params;
    return createPageMetadata({ dataset: DestinationDataset.EmailAS, category, sector });
}

export default async function MailSector({ params }: MailSectorProps) {
    const { category, sector } = await params;
    const result = await getLatestMeasurements(DestinationDataset.EmailAS, category, sector);

    const GroupIcon = getIconForCategory(category);

    return (
        <div className="p-4">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Zijn we al autonoom?</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/email-as" className="flex items-center gap-2">
                            <Mail className="w-3 h-3" />
                            Mail
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href={`/email-as/${category}`} className="flex items-center gap-2">
                            <GroupIcon className="w-3 h-3" />
                            {getCategoryLabel(category)}
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href={`/email-as/${category}/${sector}`} className="flex items-center gap-2">
                            <GroupIcon className="w-3 h-3" />
                            {getSectorLabel(sector)}
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <Card className="mt-4 mb-4">
                <CardHeader>
                    <CardTitle>
                        <div className="flex gap-2 items-center">
                            <GroupIcon />
                            {getSectorLabel(sector)}
                        </div>
                    </CardTitle>
                </CardHeader>
            </Card>
            {/* <FrequencyBarChart frequencies={frequencies} /> */}
            <OrganisationTable type={DestinationDataset.EmailAS} data={result} />
        </div>
    )
}