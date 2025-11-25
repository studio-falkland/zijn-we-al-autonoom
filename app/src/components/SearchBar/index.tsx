'use client';

import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { SearchData, SearchOrganisation } from '../../../scripts/generate-search-json.mjs';
import createFuzzySearch, { FuzzySearcher } from '@nozbe/microfuzz'
import { useCombobox } from 'downshift';
import { cx } from 'class-variance-authority';
import Link from 'next/link';
import { getEmojiForCountryCode, getIconForCategory } from '@/lib/icons';
import { Category, Sectors } from '@are-we-dependent/data';
import { getCategoryLabel, getSectorLabel } from '@/lib/labels';
import { ArrowRight, Search } from 'lucide-react';

/**
 * The maximum number of results to show in the search bar
 */
const MAX_RESULTS = 25;

/**
 * Displays a search bar that helps user find organisations and places.
 */
export default function SearchBar() {
    // The query string in the search bar
    const [query, setQuery] = useState('');

    // Keep track of the data and search results
    const data = useRef<SearchData | 'loading' | null>(null);
    const search = useRef<FuzzySearcher<SearchOrganisation> | null>(null);

    // The number of results found and the items to display
    const { noResults, items } = useMemo(() => {
        if (!search.current || !query) {
            return { noResults: 0, items: [] };
        }
        const results = search.current(query)
            .filter((item) => item.score < 3);

        return {
            noResults: results.length,
            items: results.slice(0, MAX_RESULTS),
        };
    }, [query]);

    // A loader function that retrieves a precomputed search data file from the server
    const loadData = useCallback(async () => {
        // GUARD: If the data is already loaded, return
        if (data.current) {
            return;
        }

        // Set the data to loading
        data.current = 'loading';

        // Fetch the search data from the server
        const response = await fetch('/search-data.json');

        // Set the data to the search data
        data.current = await response.json();
        search.current = createFuzzySearch(
            (data.current as SearchData).organizations,
            {
                getText: (item) => [item.name, item.city, item.address],
            }
        );
    }, []);

    const {
        isOpen,
        getLabelProps,
        getMenuProps,
        getInputProps,
        highlightedIndex,
    } = useCombobox<typeof items[number]>({
        onInputValueChange: ({ inputValue }) => {
            setQuery(inputValue);
        },
        onStateChange: ({ type }) => {
            if (type === useCombobox.stateChangeTypes.InputClick) {
                loadData();
            }
        },
        items,
    });

    return (
        <div className="relative">
            <label>
                <p
                    {...getLabelProps()}
                    className="mb-2 text-blue-800"
                >
                    Zoeken op organisatie of plaats...
                </p>
                <div className="relative">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-blue-900" />
                    <input
                        type="text"
                        placeholder="Zoeken op organisatie of plaats..."
                        className="w-full bg-white box-shadow-zwaa-small border border-blue-800 rounded-md p-4 text-xl indent-8"
                        {...getInputProps()}
                    />
                </div>
            </label>
            <div {...getMenuProps()}>
                {isOpen && items.length > 0 && (
                    <ul className="absolute top-full left-0 w-full mt-1 bg-white border border-blue-800 rounded-md z-50 p-1 max-h-[300px] overflow-y-auto shadow-xl box-shadow-zwaa">
                        {items.map((item, index) => {
                            const CategoryIcon = getIconForCategory(item.item.classifications[0].category as Category);

                            return (
                                <li
                                    key={index}
                                    className={cx(
                                        "p-3 rounded hover:bg-blue-50 cursor-pointer",
                                        highlightedIndex === index && "bg-blue-50",
                                    )}
                                >
                                    <Link href={`/organisations/${item.item.slug}`} className="grid grid-cols-[4fr_1fr_1fr] gap-4 items-center w-full">
                                        <div>
                                            <div className="text-sm text-blue-900/50 flex items-center gap-2">
                                                <CategoryIcon className="w-4 h-4 mr-2" />
                                                {getCategoryLabel(item.item.classifications[0].category as Category)}
                                                {item.item.classifications[0].sector && (
                                                    <>
                                                        <ArrowRight className="w-4 h-4" />
                                                        {getSectorLabel(item.item.classifications[0].sector as Sectors)}
                                                    </>
                                                )}
                                            </div>
                                            <p className="text-xl">{item.item.name}</p>
                                        </div>
                                        <div className="flex flex-col text-sm text-blue-900/50">
                                            <span>Email</span>
                                            <div>
                                                {getEmojiForCountryCode(item.item.measurements?.['email-as'][0]?.as_country_code)}
                                                <span className="ml-2">{item.item.measurements?.['email-as'][0]?.as_organisation}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col text-sm text-blue-900/50">
                                            <span>Webhosting</span>
                                            <div>
                                                {getEmojiForCountryCode(item.item.measurements?.['webhosting-as']?.[0]?.as_country_code)}
                                                <span className="ml-2">{item.item.measurements?.['webhosting-as']?.[0]?.as_organisation}</span>
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            )
                        })}
                        {noResults > 25 && (
                            <li className="p-3">
                                <p className="text-sm text-blue-900/50">
                                    En nog {noResults} resultaten...
                                </p>
                            </li>
                        )}
                        {noResults === 0 && (
                            <li className="p-3">
                                <p className="text-sm text-blue-900/50">
                                    Geen resultaten gevonden voor "{query}"
                                </p>
                            </li>
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
}