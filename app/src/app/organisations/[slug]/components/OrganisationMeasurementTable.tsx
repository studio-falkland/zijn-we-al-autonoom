'use client';
import { getEmojiForCountryCode, getIconForDataset } from '@/lib/icons';
import { DestinationDataset, Measurement, Organisation } from '@are-we-dependent/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getDatasetLabel } from '@/lib/labels';
import { useRedButton } from '@/components/RedButton/context';
import { getColorForMeasurement } from '@/components/RedButton';
import { cx } from 'class-variance-authority';

export interface OrganisationMeasurementTableProps {
    type: DestinationDataset;
    measurements: Measurement[];
    organisation: Organisation;
}

export default function OrganisationMeasurementTable({ 
    measurements, type,
}: OrganisationMeasurementTableProps) {
    const DatasetIcon = getIconForDataset(type);
    const [redButtonActive] = useRedButton();

    return (
        <div key={type} className="bg-white rounded-md box-shadow-zwaa border border-blue-800 flex-1">
            <h3 className="text-xl flex items-center gap-2 mb-2 p-4">
                <DatasetIcon className="w-4 h-4" />
                {getDatasetLabel(type)}
            </h3>
            <Table className="text-base">
                <TableHeader>
                    <TableRow>
                        <TableHead>URL</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Organisation</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>ASN</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {measurements.map((measurement) => (
                        <TableRow
                            key={measurement.id}
                            className={cx(
                                redButtonActive && getColorForMeasurement(measurement),
                            )}
                        >
                            <TableCell>{measurement.url?.url}</TableCell>
                            <TableCell>{new Date(measurement.created_at).toLocaleDateString('nl-NL')}</TableCell>
                            <TableCell>
                                {measurement.as_country_code ? (
                                    <>
                                        <span className="mr-2">{getEmojiForCountryCode(measurement.as_country_code)}</span>
                                        {measurement.as_organisation}
                                    </>
                                ) : (
                                    <span className="text-gray-500">{measurement.data}</span>
                                )}
                            </TableCell>
                            <TableCell>{measurement.ip}</TableCell>
                            <TableCell>{measurement.asn}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
