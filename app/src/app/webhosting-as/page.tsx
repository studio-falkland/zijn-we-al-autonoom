import HHIIndicator from '@/components/HHIIndicator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getIconForCategory } from '@/lib/icons';
import calculateHHI from '@/lib/hhi';
import { groups as groupArray } from 'd3-array';
import Link from 'next/link';
import { getLatestMeasurements } from '@/lib/queries';
import { DestinationDataset } from '@are-we-dependent/data';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({ dataset: DestinationDataset.WebhostingAS });

export default async function Webserver() {
    const result = await getLatestMeasurements(DestinationDataset.WebhostingAS);

    const groups = groupArray(result, (r) => r.organisation.classifications[0].category);

    return (
        <div>
            <Breadcrumb className="p-4">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Zijn we al autonoom?</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/webhosting-as">Webserver</BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="flex flex-wrap gap-4 p-4">
                {groups.map(([group, rows]) => {
                    const { inverseHHI, sortedFrequencies } = calculateHHI(rows, (r) => r.measurements[0].as_organisation!);
                    const Icon = getIconForCategory(group);
                    const modalCategory = sortedFrequencies[0];

                    return (
                        <Card key={group} className="max-w-[300px] font-heading hover:border-blue-200">
                            <Link href={`/webhosting-as/${group}`} prefetch={false}>
                                <CardHeader>
                                    <CardTitle>
                                        <div className="flex gap-2 items-center">
                                            <Icon />
                                            {group}
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <HHIIndicator index={inverseHHI} />
                                    <div className="mt-4">
                                        {(modalCategory.ratio * 100).toFixed(0)}% of organisations in {group} use {modalCategory.category}
                                    </div>
                                </CardContent>
                            </Link>
                        </Card>
                    )
                })}
            </div>
        </div>
    );
}
