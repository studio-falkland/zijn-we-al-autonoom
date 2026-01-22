import RedButton from '@/components/RedButton';
import { getIconForCategory } from '@/lib/icons';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink } from '@/components/ui/navigation-menu';
import hierarchy, { DestinationDataset } from '@are-we-dependent/data/hierarchy';
import Link from 'next/link';
import { ChartPie, Mail, Map, Server } from 'lucide-react';
import { getCategoryLabel, getRegionLabel } from '@/lib/labels';
import styles from './menu.module.css';
export default function Menu() {
    return (
        <div className="sticky top-0 inset-x-0 z-50">
            <div className={styles['progressive-blur']}>
                <div className={styles.blur} />
                <div className={styles.blur} /> 
                <div className={styles.blur} />
            </div>
            <div className="max-w-[1280px] mx-auto py-8 max-xl:pr-4 grid grid-cols-3 items-center z-10 gap-6 relative">
                <Link href="/" className="flex md:items-center items-start gap-2" prefetch={false}>
                    <img src="/logo.svg" className="hidden md:block h-[24px] w-auto xl:-ml-[10.31%] -ml-[1%]" alt="Zijn we al autonoom?" />
                    <img src="/logo-small.svg" className="md:hidden h-[24px] w-auto" alt="Zijn we al autonoom?" />
                    <div className="rounded bg-blue-500 text-white px-2 py-1 text-xs inline-block">BETA</div>
                </Link>
                <div className="flex items-center mx-auto justify-center">
                    <RedButton />
                </div>
                <NavigationMenu className="ml-auto">
                    <NavigationMenuList>
                        <NavigationMenuItem>
                            <NavigationMenuTrigger className="text-lg">
                                <Map className="w-6 h-6 md:w-5 md:h-5" />
                                <span className="hidden md:block ml-2">Kaart</span>
                            </NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <NavigationMenuLink asChild>
                                    <Link
                                        className="flex p-2 gap-4 group items-start hover:bg-blue-50/50 rounded-lg w-72"
                                        href={`/map/${DestinationDataset.EmailAS}`}
                                        prefetch={false}
                                    >
                                        <div className="p-4 bg-blue-50 rounded">
                                            <Mail />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium items-start text-blue-900">Email</h3>
                                            <p className="text-sm text-blue-900/50">E-mailinfrastructuur van diverse Nederlandse organisaties</p>
                                        </div>
                                    </Link>
                                </NavigationMenuLink>
                                <NavigationMenuLink asChild>
                                    <Link
                                        className="flex p-2 gap-4 items-center group hover:bg-blue-50/50 rounded-lg w-72"
                                        href={`/map/${DestinationDataset.WebhostingAS}`}
                                        prefetch={false}
                                    >
                                        <div className="p-4 bg-blue-50 rounded">
                                            <Server />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-blue-900">Webhosting</h3>
                                            <p className="text-sm text-blue-900/50">De webhosting achter de websites van diverse Nederlandse organisaties</p>
                                        </div>
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <NavigationMenuTrigger className="text-lg">
                                <ChartPie className="w-6 h-6 md:w-5 md:h-5" />
                                <span className="hidden md:block ml-2">Sectoren</span>
                            </NavigationMenuTrigger>
                            <NavigationMenuContent className="flex gap-4 md:flex-row flex-col">
                                {hierarchy.map((region) => (
                                    <div key={region.type}>
                                        <h2 className="font-bold p-2 text-lg">{getRegionLabel(region.type)}</h2>
                                        {region.children.map((category) => {
                                            const Icon = getIconForCategory(category.type);
                                            return (
                                                <NavigationMenuLink
                                                    key={category.type}
                                                    asChild
                                                >
                                                    <Link
                                                        className="flex p-2 gap-4 group items-start hover:bg-blue-50/50 rounded-lg w-72"
                                                        href={`/email-as/${category.type}`}
                                                        prefetch={false}
                                                    >
                                                        <div className="p-4 bg-blue-50 rounded">
                                                            <Icon />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-medium text-blue-900">{getCategoryLabel(category.type)}</h3>
                                                            <p className="text-sm text-blue-900/50">{category.description}</p>
                                                        </div>
                                                    </Link>
                                                </NavigationMenuLink>
                                            );
                                        })}
                                    </div>
                                ))}
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                        {/* <NavigationMenuItem>
                            <a href="#" className="text-blue-500">
                                Autonomer worden
                            </a>
                        </NavigationMenuItem> */}
                    </NavigationMenuList>
                </NavigationMenu>
            </div>
        </div>
    );
}