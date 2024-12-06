import FrequencyBarChart from '@/components/FrequencyBarChart';
import HHIIndicator from '@/components/HHIIndicator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import db from '@/lib/database';
import { getGroupForCategory, getIconForGroup, getLabelForGroup, groupMap, Groups, mapGroupsToCategories } from '@/lib/groups';
import calculateHHI from '@/lib/hhi';
import { groups as groupArray } from 'd3-array';

export async function generateStaticParams() {
    return Object.keys(groupMap).map((group) => ({ group }));
}

export interface Row {
    id: number
    url: string
    type: string
    measurement: string
    category: string
    name: string
}

export default async function MailGroup({ params }: { params: Promise<{ group: Groups }> }) {
    const { group } = await params;
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
            type = 'mx-root'
            AND urls.category IN (SELECT value FROM json_each(?))
    `).all(JSON.stringify(mapGroupsToCategories[group])) as Row[];

    const groups = groupArray(result, (r: Row) => r.category);
    const GroupIcon = getIconForGroup(group);

    return (
        <div className="p-4">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Zijn we nog afhankelijk?</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/mail">Mail</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href={`/mail/${group}`}>
                            {getLabelForGroup(group)}
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <Card className="mt-4 mb-4">
                <CardHeader>
                    <CardTitle>
                        <div className="flex gap-2 items-center">
                            <GroupIcon />
                            {getLabelForGroup(group)}
                        </div>
                    </CardTitle>
                </CardHeader>
            </Card>
            {groups.map(([group, rows]) => {
                const { inverseHHI, sortedFrequencies } = calculateHHI(rows, (r) => r.measurement);

                return (
                    <details key={group}>
                        <summary>{group} {inverseHHI.toFixed(1)}</summary>
                        <FrequencyBarChart frequencies={sortedFrequencies} />
                        <Table className="mt-4">
                            <TableHeader>
                                <TableRow>
                                    <TableCell>Organisation</TableCell>
                                    <TableCell>URL</TableCell>
                                    <TableCell>E-mail provider</TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.sort((a,b) => a.name?.localeCompare(b.name)).map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell>{row.name}</TableCell>
                                        <TableCell>{row.url}</TableCell>
                                        <TableCell>{row.measurement}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </details>
                )
            })}

        </div>
    );
}
