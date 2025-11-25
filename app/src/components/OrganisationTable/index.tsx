'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { LatestMeasurementResult } from '@/lib/queries';
import { useRedButton } from '@/components/RedButton/context';
import { getEmojiForCountryCode } from '@/lib/icons';
import Link from 'next/link';

export interface OrganisationTableProps extends React.HTMLAttributes<HTMLTableElement> {
    type: 'email-as' | 'webhosting-as';
    data: LatestMeasurementResult[];
}

export default function OrganisationTable({ 
    type, 
    data,
    ...props
}: OrganisationTableProps) {
    const [isRedButtonActive] = useRedButton();
    
    return (
        <Table {...props}>
            <TableHeader>
                <TableRow>
                    <TableHead>Organisatie</TableHead>
                    <TableHead>URL</TableHead>
                    {type === 'email-as' && <TableHead>E-mail Server</TableHead>}
                    <TableHead>Netwerkprovider</TableHead>
                    <TableHead>Jurisdictie</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row) => (
                    <TableRow 
                        key={row.id}
                        className={`hover:bg-gray-50 ${isRedButtonActive && row.measurements[0].as_country_code === 'US' ? 'text-red-500' : ''}`}
                    >
                        <TableCell className="p-0">
                            <Link 
                                href={`/organisations/${row.organisation.slug}`} 
                                className="block w-full h-full px-4 py-2"
                                prefetch={false}
                            >
                                {row.organisation.name}
                            </Link>
                        </TableCell>
                        <TableCell className="p-0">
                            <Link 
                                href={`/organisations/${row.organisation.slug}`}
                                className="block w-full h-full px-4 py-2"
                                prefetch={false}
                            >
                                {row.url}
                            </Link>
                        </TableCell>
                        {type === 'email-as' && (
                            <TableCell className="p-0">
                                <Link 
                                    href={`/organisations/${row.organisation.slug}`}
                                    className="block w-full h-full px-4 py-2"
                                    prefetch={false}
                                >
                                    {row.measurements[0].data}
                                </Link>
                            </TableCell>
                        )}
                        <TableCell className="p-0">
                            <Link 
                                href={`/organisations/${row.organisation.slug}`}
                                className="block w-full h-full px-4 py-2"
                                prefetch={false}
                            >
                                {row.measurements[0].as_organisation}
                            </Link>
                        </TableCell>
                        <TableCell className="p-0">
                            <Link 
                                href={`/organisations/${row.organisation.slug}`}
                                className="block w-full h-full px-4 py-2"
                                prefetch={false}
                            >
                                {getEmojiForCountryCode(row.measurements[0].as_country_code)}
                            </Link>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}