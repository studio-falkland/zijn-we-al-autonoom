import FrequencyBarChart from '@/components/FrequencyBarChart';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import calculateHHI from '@/lib/hhi';
import { getIconForCategory } from '@/lib/icons';
import { getCategoryLabel } from '@/lib/labels';
import { Category, DestinationDataset, Region } from '@are-we-dependent/data';
import { groups as groupArray } from 'd3-array';
import { Server } from 'lucide-react';
import { getLatestMeasurements } from '@/lib/queries';
import RatioCard from '@/components/RatioCard';
import { createPageMetadata } from '@/lib/metadata';

export async function generateStaticParams() {
    return Object.values(Category).map((category) => ({ category }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: Category }> }) {
    const { category } = await params;
    return createPageMetadata({ dataset: DestinationDataset.WebhostingAS, category });
}

export default async function WebserverCategory({ params }: { params: Promise<{ category: Category }> }) {
    const { category } = await params;
    const result = await getLatestMeasurements(DestinationDataset.WebhostingAS, category);

    const totalFrequencies = calculateHHI(result, (r) => r.measurements[0].as_organisation!).sortedFrequencies;
    const groups = groupArray(result, (r) => r.organisation.classifications[0].sector!);
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
                        <BreadcrumbLink href="/webhosting-as" className="flex items-center gap-2">
                            <Server className="w-3 h-3" />
                            Webhosting
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href={`/webhosting-as/${category}`} className="flex items-center gap-2">
                            <GroupIcon className="w-3 h-3" />
                            {getCategoryLabel(category)}
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <Card className="mt-4 mb-4">
                <CardHeader>
                    <CardTitle>
                        <div className="flex gap-2 items-center">
                            <GroupIcon />
                            {getCategoryLabel(category)}
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <FrequencyBarChart frequencies={totalFrequencies} />
                </CardContent>
            </Card>
            <div className="flex flex-col gap-4 mt-8">
                {groups.map(([group]) => (
                    <RatioCard
                        dataset={DestinationDataset.WebhostingAS}
                        category={category}
                        sector={group}
                        key={group}
                    />
                ))}
            </div>
        </div>
    );
}
