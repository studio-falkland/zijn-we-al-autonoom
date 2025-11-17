'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { LatestMeasurementResult } from '@/lib/queries';
import { useRedButton } from '@/components/RedButton/context';
import { getEmojiForCountryCode } from '@/lib/icons';

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
                    <TableRow key={row.id} className={isRedButtonActive && row.measurements[0].as_country_code === 'US' ? 'text-red-500' : ''}>
                        <TableCell>{row.organisation.name}</TableCell>
                        <TableCell>{row.url}</TableCell>
                        {type === 'email-as' && <TableCell>{row.measurements[0].data}</TableCell>}
                        <TableCell>{row.measurements[0].as_organisation}</TableCell>
                        <TableCell>
                            {getEmojiForCountryCode(row.measurements[0].as_country_code)}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}