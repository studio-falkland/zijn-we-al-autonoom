import FrequencyBarChart from '@/components/FrequencyBarChart';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import db from '@/lib/db';
import calculateHHI from '@/lib/hhi';
import { getIconForCategory } from '@/lib/icons';
import { OrganisationCategory, URL } from '@are-we-dependent/data';
import { groups as groupArray } from 'd3-array';

export async function generateStaticParams() {
    return Object.values(OrganisationCategory).map((category) => ({ category }));
}

export interface Row {
    id: number
    url: string
    type: string
    measurement: string
    category: string
    name: string
}

export default async function MailCategory({ params }: { params: Promise<{ category: OrganisationCategory }> }) {
    const { category } = await params;
    const result = await db.manager.find(URL, {
        relations: ['measurements', 'organisation', 'organisation.classifications'],
        where: { measurements: { type: 'mx' }, organisation: { classifications: { category } } },
    });

    const groups = groupArray(result, (r) => r.organisation.classifications[0].sector);
    const GroupIcon = getIconForCategory(category);

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
                        <BreadcrumbLink href={`/mail/${category}`}>
                            {category}
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <Card className="mt-4 mb-4">
                <CardHeader>
                    <CardTitle>
                        <div className="flex gap-2 items-center">
                            <GroupIcon />
                            {category}
                        </div>
                    </CardTitle>
                </CardHeader>
            </Card>
            {groups.map(([group, rows]) => {
                const { inverseHHI, sortedFrequencies } = calculateHHI(rows, (r) => r.measurements.at(-1)!.data);

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
                                {rows.sort((a,b) => a.organisation.name.localeCompare(b.organisation.name)).map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell>{row.organisation.name}</TableCell>
                                        <TableCell>{row.url}</TableCell>
                                        <TableCell>{row.measurements.at(-1)!.data}</TableCell>
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
