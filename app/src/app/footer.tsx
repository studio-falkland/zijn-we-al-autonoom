import { getCategoryLabel } from '@/lib/labels';
import { getLatestUpdateDate } from '@/lib/queries';
import { Category, DestinationDataset } from '@are-we-dependent/data';
import Link from 'next/link';

export default async function Footer() {
    const { latestDate } = await getLatestUpdateDate();
    const formattedLatestDate = new Date(latestDate).toLocaleDateString('nl-NL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });


    return (
        <footer className="bg-[#f6f6f6] mt-40">
            <svg width="100%" height="12">
                <defs>
                    <pattern id="footer-pattern" width="24" height="12" x="0" y="0" patternUnits="userSpaceOnUse">
                        <path d="M12 0L0 12H24L12 0Z" fill="#f6f6f6" />
                    </pattern>
                </defs>
                <rect width="100%" height="12" fill="#f1f1f8" />
                <rect width="100%" height="12" fill="url(#footer-pattern)" />
            </svg>
            <div className="max-w-[1280px] mx-auto py-16 max-xl:pr-4 grid grid-cols-3 gap-8 relative text-[#444]">
                <div>
                    <img src="/logo.svg" className="h-[24px] my-1.5 grayscale" />
                    <p className="mt-4">
                        <span className="font-bold">Zijn we al autonoom?</span>
                        {' '}
                        brengt in kaart hoe afhankelijk het internet in Nederland is van van niet-Europese technologie.
                    </p>
                    <p className="mt-4">
                        De laatste update van de data was op
                        {' '}
                        <span className="font-bold">{formattedLatestDate}</span>
                        . Data is vergaard uit openbare bronnen.
                    </p>
                </div>
                <div className="text-[#999] grid gap-4 grid-cols-2 h-fit">
                    <a href="https://falkland.studio" target="_blank" className="opacity-80 hover:opacity-100 transition-opacity">
                        <p>Ontwikkeld door</p>
                        <img src="/falkland-logo-long.svg" className="h-[32px] mt-2" />
                    </a>
                    <a href="https://hoehetnetwerkt.nl" target="_blank" className="opacity-80 hover:opacity-100 transition-opacity">
                        <p>Onderdeel van de call</p>
                        <img src="/internet-infrastructuur-in-beeld-logo.svg" className="h-[40px] mt-2" />
                    </a>
                    <a href="https://sidnfonds.nl" target="_blank" className="opacity-80 hover:opacity-100 transition-opacity">
                        <p>Gefinancierd door</p>
                        <img src="/sidn-fonds-logo.svg" className="h-[22px] mt-2" />
                    </a>
                    <a href="https://sidnlabs.nl" target="_blank" className="opacity-80 hover:opacity-100 transition-opacity">
                        <p>Ondersteund door</p>
                        <img src="/sidn-labs-logo.svg" className="h-[32px] mt-2" />
                    </a>
                </div>
                <div className="flex gap-2">
                    <div className="w-full">
                        <Link href="/" className="text-blue-800 block">Home</Link>
                        <Link href="/about" className="text-blue-800 block">Over</Link>
                        <Link href="/sources" className="text-blue-800 block">Bronnen & Attributie</Link>
                        <p className="opacity-25 mt-1.5">Visualisaties</p>
                        <p className="opacity-50">Kaarten</p>
                        <Link href={`/map/${DestinationDataset.EmailAS}`} className="text-blue-800 block">Email</Link>
                        <Link href={`/map/${DestinationDataset.WebhostingAS}`} className="text-blue-800 block">Webhosting</Link>
                    </div>
                    <div className="w-full">
                        <p className="mt-1.5 opacity-50">E-mail</p>
                        {Object.values(Category).map((category) => (
                            <Link
                                href={`/email-as/${category}`}
                                className="text-blue-800 block"
                                key={category}
                            >
                                {getCategoryLabel(category)}
                            </Link>
                        ))}
                    </div>
                    <div className="w-full">
                        <p className="mt-1.5 opacity-50">Webhosting</p>
                        {Object.values(Category).map((category) => (
                            <Link
                                href={`/webhosting-as/${category}`}
                                className="text-blue-800 block"
                                key={category}
                            >
                                {getCategoryLabel(category)}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}