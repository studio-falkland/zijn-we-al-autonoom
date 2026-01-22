import Map from '@/components/Map';
import RatioCard from '@/components/RatioCard';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { getIconForCategory } from '@/lib/icons';
import { getCategoryLabel } from '@/lib/labels';
import { Category, DestinationDataset } from '@are-we-dependent/data';
import { groups as groupArray } from 'd3-array';
import { Mail } from 'lucide-react';
import { getLatestMeasurements } from '@/lib/queries';
import { createPageMetadata } from '@/lib/metadata';

export async function generateStaticParams() {
    return Object.values(Category).map((category) => ({ category }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: Category }> }) {
    const { category } = await params;
    return createPageMetadata({ dataset: DestinationDataset.EmailAS, category });
}

export default async function MailCategory({ params }: { params: Promise<{ category: Category }> }) {
    const { category } = await params;
    const result = await getLatestMeasurements(DestinationDataset.EmailAS, category);

    const groups = groupArray(result, (r) => r.organisation?.classifications[0].sector!);
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
            </Card>
            <Map data={result} />
            {groups.map(([group]) => (
                <div key={group} className="flex flex-col gap-4 mt-8">
                    <RatioCard
                        dataset={DestinationDataset.EmailAS}
                        category={category}
                        sector={group}
                    />
                </div>
            ))}
        </div>
    );
}
