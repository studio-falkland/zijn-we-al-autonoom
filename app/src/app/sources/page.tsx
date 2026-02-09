import { getDatasets } from '@/lib/queries';
import { sourcesMetadata } from '@/lib/metadata';

export const metadata = sourcesMetadata;

export interface Source {
    name: string;
    source: string;
    url: string;
    license: string | {
        name: string;
        url: string;
    };
    description: string;
}

const SOURCES: Source[] = [
    {
        name: 'CAIDA AS Organisations',
        source: 'CAIDA',
        url: 'https://publicdata.caida.org/datasets/as-organizations/',
        license: {
            name: 'CAIDA Acceptable Use Agreement',
            url: 'https://www.caida.org/about/legal/aua/public_aua/',
        },
        description: 'Het vertalen van AS-nummers naar de bijbehorende organisaties en jurisdicties.',
    },
    {
        name: 'IPInfo Lite',
        source: 'IPInfo',
        url: 'https://ipinfo.io/lite/',
        license: 'Creative Commons Attribution-ShareAlike 4.0 International',
        description: 'Het vaststellen van geolocatie op IP en ASN-niveau.',
    },
    {
        name: 'Register van Overheidsorganisaties',
        source: 'Rijksoverheid',
        url: 'https://organisaties.overheid.nl',
        license: 'Publiek Domein',
        description: 'Het vaststellen van organisaties en bijbehorende URLs van gemeentes, provincies, waterschappen en ministeries.',
    },
    {
        name: 'Register Internetdomeinen Overheid',
        source: 'Rijksoverheid',
        url: 'https://organisaties.overheid.nl/domeinen',
        license: 'Publiek Domein',
        description: 'Het vaststellen van domeinen van overige overheidsorganisaties.',
    },
    {
        name: 'Open Onderwijsdata',
        source: 'Dienst Uitvoering Onderwijs',
        url: 'https://duo.nl/open_onderwijsdata/',
        license: 'CC0',
        description: 'Het vaststellen van organisaties en bijbehorende URLs van basisscholen, middelbare scholen en hoger onderwijsinstellingen.',
    },
    {
        name: 'Elsevier 500 2024',
        source: 'EW Magazine',
        url: 'https://www.ewmagazine.nl/',
        license: 'Geen licentie',
        description: 'Het vaststellen van organisaties en bijbehorende URLs van de 500 grootste bedrijven van Nederland.',
    },
    {
        name: 'ENTRADA',
        source: 'SIDN Labs',
        url: 'https://stats.sidnlabs.nl/',
        license: 'Custom export',
        description: 'Statistieken verzamelen over het gehele .nl-domein.',
    },
    {
        name: 'Overpass API ',
        source: 'Open Street Map',
        url: 'https://www.openstreetmap.org/',
        license: {
            name: 'Open Data Commons Open Database License (ODbL)',
            url: 'https://opendatacommons.org/licenses/odbl/',
        },
        description: 'Het vaststellen van organisaties en URLs in de zorgsector (en potentieel andere sectoren).',
    },
    {
        name: 'PDOK',
        source: 'Kadaster',
        url: 'https://www.pdok.nl/',
        license: 'Publiek Domein',
        description: 'Het vaststellen van coordinaten op basis van adressen.',
    }
]

export default async function DatasetsPage() {
    const datasets = await getDatasets();

    return (
        <div className="max-w-[1280px] mx-auto py-16 text-xl leading-relaxed">
            <h1 className="text-4xl font-bold">Bronnen en Attributie</h1>
            <p className="mt-4">Het meten van afhankelijkheid is alleen mogelijk door verder te bouwen op andere datasets. We werken zoveel mogelijk met openbare bronnen zodat andere onze werkwijze kunnen repliceren.</p>

            <h2 className="text-2xl font-bold mt-8">Meetmethodes</h2>
            <p className="mt-2">Op basis van vele onderliggende bronnen houden wij een database bij met organisaties en URL&apos;s (gecategoriseerd naar sector en locatie). Periodiek (streven: elke maand) lopen we al deze URLs na om de aanbieder van e-mail en webhosting te bepalen. Dit doen we doormiddel van DNS lookups (MX en A), waarna we reverse lookups doen op de IP-adressen om de aanbieder en het eventuele ASN te bepalen. De informatie van zowel IP als ASN wordt tenslotte geagreggeerd om tot de visualisaties en kaarten te komen.</p>
            <p className="mt-2">De data wordt met de grootst mogelijk zorgvuldigheid verzameld. Vanwege de grootte van die datasets is het onvermijdelijk dat de meetgegevens fouten bevatten. We proberen voornamelijk op grote schaal een beeld te geven van afhankelijkheid. Mochten je als organisatie benoemd zijn op dee website, neem dan contact op bij fouten.</p>

            <h2 className="text-2xl font-bold mt-8">Bronnen</h2>
            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-2 gap-4 mt-4">
                {SOURCES.map((dataset) => (
                    <div className="bg-white p-4 rounded-xl border border-blue-800 box-shadow-zwaa" key={dataset.name}>
                        <p className="opacity-50 text-sm">Organisatie</p>
                        <h3 className="text-lg">{dataset.source}</h3>
                        <p className="opacity-50 text-sm mt-4">Dataset</p>
                        <h3 className="text-lg">{dataset.name}</h3>
                        <p className="opacity-50 text-sm mt-4">Licentie</p>
                        {typeof dataset.license === 'object' ? (
                            <h3 className="text-lg">
                                <a className="underline underline-offset-4" href={dataset.license.url} target="_blank">{dataset.license.name}</a>
                            </h3>
                        ) : (
                            <h3 className="text-lg">{dataset.license}</h3>
                        )}
                        <p className="opacity-50 text-sm mt-4">Website</p>
                        <p className="truncate underline underline-offset-4">
                            <a className="underline underline-offset-4" href={dataset.url} target="_blank">{dataset.url}</a>
                        </p>
                        <p className="opacity-50 text-sm mt-4">Doel</p>
                        <p>{dataset.description}</p>
                    </div>
                ))}
            </div>

            <h2 className="text-2xl font-bold mt-8">Onderliggende datasets</h2>
            <p className="mt-2">De exacte dataset-locaties en update-frequentie worden in de database bijgehouden. Hieronder vind je een overzicht van alle specifieke datasets die worden gebruikt en wanneer ze voor het laatst zijn bijgewerkt.</p>
            <div className="bg-white rounded-xl border border-blue-800 box-shadow-zwaa overflow-hidden mt-8">
                <table className="table-auto w-full mb-2 text-lg">
                    <thead className="text-left text-blue-900/50 border-b border-gray-200">
                        <tr>
                            <th className="font-normal p-4">Dataset ID</th>
                            <th className="font-normal p-4">URL</th>
                            <th className="font-normal p-4">Laatste update</th>
                        </tr>
                    </thead>
                    <tbody>
                        {datasets.map((dataset) => (
                            <tr key={dataset.id} className="hover:bg-blue-50 transition-colors">
                                <td className="py-2 px-4">{dataset.name}</td>
                                <td className="py-2 px-4">
                                    {dataset.source.startsWith('http') ? (
                                        <a className="underline underline-offset-4" href={dataset.source} target="_blank">{dataset.source}</a>
                                    ) : (
                                        <i>Lokale dataset</i>
                                    )}
                                </td>
                                <td className="py-2 px-4">{new Date(dataset.updated_at).toLocaleString('nl-NL')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <h2 className="text-2xl font-bold mt-8">Hergebruik materialen en datasets</h2>
            <p className="mt-2">De visualisaties worden onder voorwaarde van attributie vrijgegeven. Vernoem &quot;Zijn we al autonoom?&quot; en &quot;Studio Falkland&quot; als bron, en voeg waar mogelijk een link naar deze website toe. De dataset waarop de visualisatie gebaseerd is, is op dit moment niet beschikbaar voor hergebruik. We werken eraan om deze op een gestructureerde manier aan te bieden. Neem in de tussentijd contact op, mocht de onderliggende data van waarde zijn voor jouw project.</p>
        </div>
    );
}
