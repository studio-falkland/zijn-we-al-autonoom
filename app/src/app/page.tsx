import RatioCard from '@/components/RatioCard';
import { DestinationDataset } from '@are-we-dependent/data';
import hierarchy from '@are-we-dependent/data/hierarchy';
import { Cloud } from 'lucide-react';
import { Fragment } from 'react';

export default function Home() {
    return (
        <>
            <div className="flex py-12 items-center justify-between">
                <div className="max-w-[440px]">
                    <h2 className="text-5xl text-blue-800 font-bold tracking-tight mb-4">Zijn we al autonoom?</h2>
                    <p>De Nederlandse maatschappij functioneert niet zonder digitale infrastructuur. Zijn we al autonoom brengt in kaart van welke organisaties het internet in Nederland het meest afhankelijk is.</p>
                </div>
                <Cloud fill="white" stroke="none" size={240} className="max-w-[240px] w-full" />
            </div>
            <h2 className="text-3xl text-blue-800 mb-8">Nationale statistieken</h2>
            <div className="grid gap-4 md:grid-cols-2 grid-cols-1">
                {hierarchy.flatMap((region) => (
                    region.children.flatMap((category) => (
                        <Fragment key={`${region.type}_${category.type}`}>
                            <RatioCard
                                region={region.type}
                                category={category.type}
                                dataset={DestinationDataset.EmailAS}
                            />
                            <RatioCard
                                region={region.type}
                                category={category.type}
                                dataset={DestinationDataset.WebhostingAS}
                            />
                        </Fragment>
                    ))
                ))}
            </div>
        </>
    );
}
