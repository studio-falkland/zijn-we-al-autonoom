import FrequencyBarChart from '@/components/FrequencyBarChart';
import Concentration from '@/components/RatioCard/Concentration';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import db from '@/lib/db';
import calculateHHI from '@/lib/hhi';
import { getIconForCategory } from '@/lib/icons';
import { getCategoryLabel, getSectorLabel } from '@/lib/labels';
import { Category, DestinationDataset, URL } from '@are-we-dependent/data';
import { groups as groupArray } from 'd3-array';
import { Server } from 'lucide-react';

export async function generateStaticParams() {
    return Object.values(Category).map((category) => ({ category }));
}

export interface Row {
    id: number
    url: string
    type: string
    measurement: string
    category: string
    name: string
}

export default async function WebserverCategory({ params }: { params: Promise<{ category: Category }> }) {
    const { category } = await params;
    const result = await db.manager.find(URL, {
        relations: ['measurements', 'organisation', 'organisation.classifications'],
        where: { measurements: { type: DestinationDataset.WebhostingAS }, organisation: { classifications: { category } } },
    });

    const totalFrequencies = calculateHHI(result, (r) => r.measurements.at(-1)!.as_organisation!).sortedFrequencies;
    const groups = groupArray(result, (r) => r.organisation.classifications[0].sector);
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
            {groups.map(([group, rows]) => {
                const { inverseHHI, sortedFrequencies } = calculateHHI(rows, (r) => r.measurements.at(-1)!.as_organisation!);

                return (
                    <details key={group}>
                        <summary className="flex gap-4 items-center">
                            {getSectorLabel(group)} {inverseHHI.toFixed(1)}
                            <Concentration frequencies={sortedFrequencies} />
                        </summary>
                        <FrequencyBarChart frequencies={sortedFrequencies} />
                        <Table className="mt-4">
                            <TableHeader>
                                <TableRow>
                                    <TableCell>Organisation</TableCell>
                                    <TableCell>URL</TableCell>
                                    <TableCell>Webserver provider</TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.sort((a,b) => a.organisation.name.localeCompare(b.organisation.name)).map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell>{row.organisation.name}</TableCell>
                                        <TableCell>{row.url}</TableCell>
                                        <TableCell>{row.measurements.at(-1)!.as_organisation}</TableCell>
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
