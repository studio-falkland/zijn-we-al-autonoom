import HHIIndicator from '@/components/HHIIndicator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import db from '@/lib/database';
import { getGroupForCategory, getIconForGroup, getLabelForGroup } from '@/lib/groups';
import calculateHHI from '@/lib/hhi';
import { groups as groupArray } from 'd3-array';
import Link from 'next/link';

export interface Row {
    id: number
    url: string
    type: string
    measurement: string
    category: string
    name: string
}

export default function Mail() {
    const result = db.prepare(`
        SELECT
            measurements.*,
            urls.category,
            organisations.name
        FROM
            measurements
            LEFT JOIN urls ON measurements.url = urls.url
            LEFT JOIN organisations ON organisations.id = urls.organisation_id
        WHERE
            TYPE = 'mx-root'
    `).all() as Row[];

    const groups = groupArray(result, (r: Row) => getGroupForCategory(r.category));

    return (
        <div>
            <Breadcrumb className="p-4">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Zijn we nog afhankelijk?</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/mail">Mail</BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="flex flex-wrap gap-4 p-4">
                {groups.map(([group, rows]) => {
                    const { inverseHHI, sortedFrequencies } = calculateHHI(rows, (r) => r.measurement);
                    const Icon = getIconForGroup(group);
                    const modalCategory = sortedFrequencies[0];

                    return (
                        <Card key={group} className="max-w-[300px] font-heading hover:border-blue-200">
                            <Link href={`/mail/${group}`}>
                                <CardHeader>
                                    <CardTitle>
                                        <div className="flex gap-2 items-center">
                                            <Icon />
                                            {getLabelForGroup(group)}
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <HHIIndicator index={inverseHHI} />
                                    <div className="mt-4">
                                        {(modalCategory.ratio * 100).toFixed(0)}% of organisations in {getLabelForGroup(group)} use {modalCategory.category}
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
