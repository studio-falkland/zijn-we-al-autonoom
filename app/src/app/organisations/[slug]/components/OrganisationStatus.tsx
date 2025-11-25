'use client';
import { getColorForMeasurement } from '@/components/RedButton';
import { useRedButton } from '@/components/RedButton/context';
import { getEmojiForCountryCode, getIconForDataset } from '@/lib/icons';
import { getDatasetLabel } from '@/lib/labels';
import { DestinationDataset, Measurement, Organisation } from '@are-we-dependent/data';
import { cx } from 'class-variance-authority';

export interface OrganisationStatusProps {
    organisation: Organisation;
    measurement?: Measurement;
    type: DestinationDataset;
}

export default function OrganisationStatus({
    organisation, type, measurement,
}: OrganisationStatusProps) {
    const DatasetIcon = getIconForDataset(type);
    const [redButtonActive] = useRedButton();

    return (
        <div key={type} className="bg-white rounded-md box-shadow-zwaa border border-blue-800 flex-1 p-4">
            <h3 className="text-xl flex items-center gap-2 mb-2">
                <DatasetIcon className="w-4 h-4" />
                {getDatasetLabel(type)}
            </h3>
            {measurement ? (
                <>
                    <h1 className={cx(
                        "text-4xl flex items-center gap-2 justify-center mb-2",
                        redButtonActive && getColorForMeasurement(measurement),
                    )}>
                        {getEmojiForCountryCode(measurement.as_country_code)}
                        <span className="ml-1">{measurement.as_organisation}</span>
                    </h1>
                    <p className="text-center text-gray-500 text-base">
                        De {getDatasetLabel(type)} van {organisation.name} wordt verzorgd door <span className="font-bold">{measurement.as_organisation}</span>. De jurisdictie van deze provider is <span className="font-bold">{measurement.as_country_code}</span>.
                    </p>
                </>
            ) : (
                <span className="text-gray-500">Niet gemeten</span>
            )}
        </div>
    );
}