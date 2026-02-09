import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function About() {
    return (
        <div className="mt-12 flex">
            <div>
                <h1 className="text-5xl tracking-tight mb-12">Over &mdash; <span className="font-bold">Zijn we al autonoom?</span></h1>
                <p className="text-2xl mb-4">Het internet raakt meer en meer gecentraliseerd bij enkele grote partijen. Voor een steeds digitaler Nederland kan die toenemende afhankelijkheid problematisch worden. Als die afhankelijkheid bijvoorbeeld tegen ons wordt gebruikt.</p> 
                <p className="text-2xl mb-12">Zijn we al autonoom? maakt zichtbaar van welke partijen het internet in Nederland afhankelijk is en in welke sectoren die afhankelijkheid het grootst is.</p>
                <p className="text-2xl mb-4">Zijn we al autonoom? is een onderzoeksproject van <b>Studio Falkland</b>, een ontwerpstudio uit Eindhoven die werkt aan een vrijer en autonomer internet.</p>
                <a href="https://falkland.studio" className="text-blue-800 text-2xl mb-12 flex items-center" target="_blank">
                    Bekijk Studio Falkland
                    <ArrowRight size={24} className="inline-block ml-2" />
                </a>
                <p className="text-2xl mb-4">Het project is ontwikkeld als onderdeel van de call <b>Internet Infrastructuur in Beeld</b> van <b>SIDN Fonds</b>. Hierin werken teams van ontwerpers samen met <b>SIDN Labs</b> aan visualisaties die de protocollen, infrastructuur en organisaties achter het internet in beeld brengen.</p>
                <a href="https://www.sidnfonds.nl/nieuws/nieuws-internet-infrastructuur-in-beeld-van-start" className="text-blue-800 text-2xl mb-4 flex items-center" target="_blank">
                    SIDN Fonds en de call Internet Infrastructuur in Beeld
                    <ArrowRight size={24} className="inline-block ml-2" />
                </a>
                <a href="https://hoehetnetwerkt.nl" className="text-blue-800 text-2xl mb-4 flex items-center" target="_blank">
                    Bekijk alle visualisaties van Internet Infrastructuur in Beeld
                    <ArrowRight size={24} className="inline-block ml-2" />
                </a>
                <a href="https://sidnlabs.nl" className="text-blue-800 text-2xl mb-12 flex items-center" target="_blank">
                    Bekijk SIDN Labs
                    <ArrowRight size={24} className="inline-block ml-2" />
                </a>

                <p className="text-2xl mb-4">We werken op basis van openbare data en publiek gemaakte datasets. Ben je benieuwd hoe die data vergaard wordt en welke bronnen we gebruiken? </p>

                <Link href="/sources" className="text-blue-800 text-2xl mb-12 flex items-center">
                    Bekijk onze bronnen en meetmethodes
                    <ArrowRight size={24} className="inline-block ml-2" />
                </Link>

                <p className="text-2xl mb-4">Heb je vragen, opmerkingen of ben je geïnteresseerd in samenwerkingen? Neem dan contact op met <b>Lei Nelissen</b>: lei [at] falkland [punt] studio.</p>
                <a href="https://mastodon.social/@lei_nelissen" className="text-blue-800 text-2xl mb-12 flex items-center" target="_blank">
                    Mastodon
                    <ArrowRight size={24} className="inline-block ml-2" />
                </a>
            </div>
            <div>
                <img src="/nl-map-art.png" alt="Nederlandse kaart" className="ml-12 -mr-48 max-w-[600px] lg:block hidden h-auto flex-shrink-0 flex-grow-0 min-w-0" />
            </div>
        </div>
    )
}