import HHIIndicator from '@/components/HHIIndicator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getIconForCategory } from '@/lib/icons';
import calculateHHI from '@/lib/hhi';
import { DestinationDataset, URL } from '@are-we-dependent/data';
import { groups as groupArray } from 'd3-array';
import Link from 'next/link';
import db from '@/lib/db';

export interface Row {
    id: number
    url: string
    type: string
    measurement: string
    category: string
    name: string
}

export default async function Webserver() {
    const result = await db.manager.find(URL, {
        relations: ['measurements', 'organisation', 'organisation.classifications'],
        where: { measurements: { type: DestinationDataset.WebhostingAS } },
    });

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
                        <BreadcrumbLink href="/webserver">Webserver</BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="flex flex-wrap gap-4 p-4">
                {groups.map(([group, rows]) => {
                    const { inverseHHI, sortedFrequencies } = calculateHHI(rows, (r) => r.measurements.at(-1)?.as_organisation!);
                    const Icon = getIconForCategory(group);
                    const modalCategory = sortedFrequencies[0];

                    return (
                        <Card key={group} className="max-w-[300px] font-heading hover:border-blue-200">
                            <Link href={`/webserver/${group}`} prefetch={false}>
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
