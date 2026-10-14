// The kiosk's two languages, in one place.
//
// Dutch (`nl`) is the base: `Messages` is derived from its shape, so every other
// language must provide exactly the same keys and can never drift out of sync.
// Namespaced by screen/component, with `common` for copy shared across screens.
//
// Interpolation uses i18n-js placeholders: `%{count}`, `%{postcode}`, `%{place}`,
// `%{seconds}`.

// The languages the kiosk offers, in tab order (NL Dutch, EN English).
export const LANGUAGES = ['nl', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

// Dutch — the installation's primary language and the base for `Messages`.
export const nl = {
    // Shared across several screens.
    common: {
        continue: 'Doorgaan',
        back: 'Terug',
        cancel: 'Annuleren',
        noMeasurements: 'Geen meetgegevens voor deze selectie.',
    },

    // Start screen.
    intro: {
        body1: 'Onze samenleving is in hoge mate afhankelijk van digitale infrastructuur.',
        body2: 'Wil je weten hoe deze afhankelijkheden je dagelijks leven beïnvloeden?',
        start: 'Begin met ontdekken',
    },

    // Gather step: the visitor's location.
    gather: {
        lead1: 'Laten we beginnen bij onze omgeving.',
        lead2: 'Zoom naar waar je woont of verblijft en tik op de kaart.',
        explore: 'Verken',
        explorePostcode: 'Verken %{postcode}',
        you: 'Jij',
        liveIn: 'Woont in %{place}',
        whereDoYouLive: 'Waar woon je?',
    },

    // The map's search box (PDOK results).
    search: {
        placeholder: 'Zoek op plaats of postcode…',
        types: {
            gemeente: 'Gemeente',
            woonplaats: 'Plaats',
            postcode: 'Postcode',
        },
    },

    // Services step: the providers locked in by the visitor's location.
    services: {
        heading: 'Deze horen bij waar je woont',
        finding: 'We zoeken je leveranciers…',
        explainer: 'Waar je woont bepaalt welke dienstverleners je gebruikt.',
        selectOnMap: 'Selecteer ze op de kaart.',
        governmentQuestion: 'Gebruik je een van deze landelijke diensten?',
        governmentBody: 'Selecteer ze hieronder.',
        skip: 'Ik gebruik er geen',
    },

    // The per-category review questions.
    categories: {
        education: 'Gaat een van je gezinsleden naar een van deze onderwijsinstellingen?',
        healthcare: 'Gebruik jij of je gezinsleden een van deze zorgverleners?',
    },

    // The reveal stage (the /generate step): three button-gated phases.
    reveal: {
        preTurn1: 'Je dagelijks leven is zo afhankelijk van deze diensten.',
        preTurn2: 'Deze diensten zijn zelf ook afhankelijk van digitale infrastructuur.',
        preTurn3: 'Laten we onthullen hoe zij van deze infrastructuur afhankelijk zijn.',
        preColor: 'Heb je bekende namen gezien? Wat als iemand ze uitzette?',
        postColor: 'Hoeveel van je dagelijks leven blijft er over?',
        reveal: 'Onthul',
        shutdown: 'Zet ze uit',
    },

    // The fuse stage (the /fuse step): the cards merge into the personal card.
    fuse: {
        heading: 'Dit is jouw kaart',
        line: 'Al je diensten, samengevat op één kaart.',
        print: 'Print kaart',
        printing: 'Printen…',
        reprint: 'Opnieuw printen',
    },

    // The outro: the four-step guidance diagram's copy and the closing lines.
    outro: {
        guidance: 'Alle uitleg vind je op je kaart.',
        together: 'Laten we samen de afhankelijkheid van onze samenleving in beeld brengen!',
        thanks: 'Bedankt voor je deelname!',
        returnToStart: 'Terug naar start (%{seconds}s)',
    },

    // The outro diagram's step labels.
    steps: {
        guidance: 'Volg de uitleg',
        personal: 'Plak op je persoonlijke kaart',
        pin: 'Pin op de kaart',
        share: 'Deel je gedachten',
    },

    // The shared failure state.
    failure: {
        title: 'Er ging iets mis',
        retry: 'Probeer opnieuw',
    },

    // The full-map selection screen.
    map: {
        title: 'Waar woon je?',
        hint: 'Zoom in op de kaart en tik op diensten om ze te selecteren.',
        selectedCount: 'Geselecteerd (%{count})',
        empty: 'Tik op de kaart op diensten om ze toe te voegen.',
        loadError: 'De kaart kon niet worden geladen.',
    },

    // Sector labels, keyed on the data layer's sector values.
    sectors: {
        government_ministry: 'Ministerie',
        government_province: 'Provincie',
        government_municipality: 'Gemeente',
        government_water_board: 'Waterschap',
        government_other: 'Overig',
        healthcare_hospital: 'Ziekenhuis',
        healthcare_pharmacy: 'Apotheek',
        healthcare_dentist: 'Tandarts',
        healthcare_physiotherapist: 'Fysiotherapeut',
        healthcare_nursing_home: 'Verzorgingstehuis',
        healthcare_other: 'Overig',
        education_daycare: 'Kinderopvang',
        education_primary: 'Basisschool',
        education_secondary: 'Middelbaar onderwijs',
        education_higher: 'Hoger onderwijs',
        utilities_power: 'Energie',
        utilities_water: 'Drinkwater',
    },

    // Print screen (direct printing to the kiosk's selected printer).
    print: {
        title: 'Printen',
        making: 'Kaart maken…',
        ready: 'De kaart staat klaar.',
        print: 'Printen',
        done: 'Klaar',
        generateError: 'Fout bij het maken van de kaart.',
        printError: 'Printen is mislukt.',
    },

    // The restart confirmation dialog.
    restart: {
        title: 'Opnieuw beginnen?',
        message: 'Hiermee wis je je keuzes en ga je terug naar het begin.',
        confirm: 'Opnieuw beginnen',
    },

    // The personalised A7 card (on screen and printed).
    card: {
        visitorTitle: 'Jij',
        livesIn: 'Woont in %{place}',
        yourNeighbourhood: 'jouw buurt',
        unknown: 'Onbekend',
        others: 'Overig',
        buildError: 'De kaart kon niet worden gemaakt.',
    },
};

// Turn the base dictionary's literal strings into `string`, so a translation may
// differ from the Dutch text while its key structure is enforced.
type Translatable<T> = { [K in keyof T]: T[K] extends string ? string : Translatable<T[K]> };
export type Messages = Translatable<typeof nl>;

// English — the same keys as Dutch.
export const en: Messages = {
    common: {
        continue: 'Continue',
        back: 'Back',
        cancel: 'Cancel',
        noMeasurements: 'No measurement data for this selection.',
    },

    intro: {
        body1: 'Our society relies deeply on digital infrastructures.',
        body2: 'Do you want to know how your daily life is influenced by these dependencies?',
        start: 'Start to explore',
    },

    gather: {
        lead1: "Let's start from our surroundings.",
        lead2: 'Zoom to where you live or stay, then tap the map.',
        explore: 'Explore',
        explorePostcode: 'Explore %{postcode}',
        you: 'You',
        liveIn: 'Live in %{place}',
        whereDoYouLive: 'Where do you live?',
    },

    search: {
        placeholder: 'Search for places or postcodes…',
        types: {
            gemeente: 'Municipality',
            woonplaats: 'Place',
            postcode: 'Postcode',
        },
    },

    services: {
        heading: 'These come with where you live',
        finding: 'Finding your providers…',
        explainer: "Where you live decides which service providers you're using.",
        selectOnMap: 'Select them on the map.',
        governmentQuestion: 'Do you use any of these national services?',
        governmentBody: 'Select them below.',
        skip: "I don't use any",
    },

    categories: {
        education: 'Does one of your family members go to one of these educational facilities?',
        healthcare: 'Do you or your family members use any of these healthcare providers?',
    },

    reveal: {
        preTurn1: 'Your daily life relies so much on these services.',
        preTurn2: 'These services themselves also rely on digital infrastructures.',
        preTurn3: 'Let’s reveal how they depend on these infrastructures.',
        preColor: 'Have you seen some familiar names? What if someone turned them off?',
        postColor: 'How much of your daily life remains?',
        reveal: 'Reveal',
        shutdown: 'Shut them down',
    },

    fuse: {
        heading: 'This is your card',
        line: 'All your services, summarised on one card.',
        print: 'Print card',
        printing: 'Printing…',
        reprint: 'Print again',
    },

    outro: {
        guidance: 'You can find any guidance on your guidance card.',
        together: 'Let’s depict our society’s dependency together!',
        thanks: 'Thank you for participating!',
        returnToStart: 'Return to start (%{seconds}s)',
    },

    steps: {
        guidance: 'Follow guidance',
        personal: 'Stick on personal card',
        pin: 'Pin on the map',
        share: 'Share your thoughts',
    },

    failure: {
        title: 'Something went wrong',
        retry: 'Try again',
    },

    map: {
        title: 'Where do you live?',
        hint: 'Zoom in on the map and tap services to select them.',
        selectedCount: 'Selected (%{count})',
        empty: 'Tap services on the map to add them.',
        loadError: 'The map could not be loaded.',
    },

    sectors: {
        government_ministry: 'Ministry',
        government_province: 'Province',
        government_municipality: 'Municipality',
        government_water_board: 'Water authority',
        government_other: 'Other',
        healthcare_hospital: 'Hospital',
        healthcare_pharmacy: 'Pharmacy',
        healthcare_dentist: 'Dentist',
        healthcare_physiotherapist: 'Physiotherapist',
        healthcare_nursing_home: 'Nursing home',
        healthcare_other: 'Other',
        education_daycare: 'Daycare',
        education_primary: 'Primary school',
        education_secondary: 'Secondary school',
        education_higher: 'Higher education',
        utilities_power: 'Energy',
        utilities_water: 'Drinking water',
    },

    print: {
        title: 'Printing',
        making: 'Creating card…',
        ready: 'Your card is ready.',
        print: 'Print',
        done: 'Done',
        generateError: 'Could not create the card.',
        printError: 'Printing failed.',
    },

    restart: {
        title: 'Restart?',
        message: 'This clears your choices and returns to the start.',
        confirm: 'Restart',
    },

    card: {
        visitorTitle: 'You',
        livesIn: 'Live in %{place}',
        yourNeighbourhood: 'your neighbourhood',
        unknown: 'Unknown',
        others: 'Other',
        buildError: 'The card could not be created.',
    },
};

// Every language the kiosk ships, each checked against the full `Messages`
// shape. Adding a language to `LANGUAGES` without a complete dictionary here —
// or dropping a key from any language — is a compile error.
export const translations: Record<Language, Messages> = { nl, en };

// Every dotted path to a string leaf, for autocomplete and typo safety.
type Leaves<T> = {
    [K in keyof T & string]: T[K] extends string ? K : `${K}.${Leaves<T[K]>}`;
}[keyof T & string];
export type MessageKey = Leaves<Messages>;
