import { getLatestMeasurements } from '@/lib/queries';
import { Category, DestinationDataset, flatHierarchy, Sectors } from '@are-we-dependent/data';
import { getIconForCategory } from '@/lib/icons';
import OrganisationTable from '@/components/OrganisationTable';
import { getCategoryLabel, getSectorLabel } from '@/lib/labels';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Server } from 'lucide-react';

export interface WebhostingSectorProps {
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

export default async function WebhostingSector({ params }: WebhostingSectorProps) {
    const { category, sector } = await params;
    const result = await getLatestMeasurements(DestinationDataset.WebhostingAS, category, sector);

    const GroupIcon = getIconForCategory(category);

    return (
        <div>
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Zijn we al autonoom?</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/email-as" className="flex items-center gap-2">
                            <Server className="w-3 h-3" />
                            Webhosting
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
            <OrganisationTable type={DestinationDataset.WebhostingAS} data={result} />
        </div>
    )
}
