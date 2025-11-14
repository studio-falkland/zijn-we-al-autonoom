import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getIconForDataset } from '@/lib/icons';
import { getDatasetLabel } from '@/lib/labels';
import { DestinationDataset } from '@are-we-dependent/data';
import { Map } from 'lucide-react';
import Link from 'next/link';

export default async function MapPage() {
    return (
        <div>
            <Breadcrumb className="p-4">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Zijn we al autonoom?</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/map" className="flex items-center gap-2">
                            <Map className="w-3 h-3" />
                            Kaart
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="flex flex-wrap gap-4 p-4">
                {Object.values(DestinationDataset).map((dataset) => {
                    const Icon = getIconForDataset(dataset);
                    return (
                        <Card key={dataset} className="max-w-[300px] font-heading hover:border-blue-200">
                            <Link href={`/map/${dataset}`} prefetch={false}>
                                <CardHeader>
                                    <CardTitle>
                                        <div className="flex gap-2 items-center">
                                            <Icon />
                                            {getDatasetLabel(dataset)}
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div>
                                        Bekijk de {getDatasetLabel(dataset).toLowerCase()} kaart
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