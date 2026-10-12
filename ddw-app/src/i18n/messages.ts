// The kiosk's two languages, in one place.
//
// Dutch (`nl`) is the base: `Messages` is derived from its shape, so every other
// language must provide exactly the same keys and can never drift out of sync.
// Namespaced by screen, with a `common` section for shared copy as it appears.

// Dutch — the installation's primary language.
export const nl = {
    intro: {
        body1: 'Onze samenleving is in hoge mate afhankelijk van digitale infrastructuur.',
        body2: 'Wil je weten hoe deze afhankelijkheden je dagelijks leven beïnvloeden?',
        start: 'Begin met ontdekken',
    },
};

// Turn the base dictionary's literal strings into `string`, so a translation may
// differ from the Dutch text while its key structure is enforced.
type Translatable<T> = { [K in keyof T]: T[K] extends string ? string : Translatable<T[K]> };
export type Messages = Translatable<typeof nl>;

// English — the same keys as Dutch.
export const en: Messages = {
    intro: {
        body1: 'Our society relies deeply on digital infrastructures.',
        body2: 'Do you want to know how your daily life is influenced by these dependencies?',
        start: 'Start to explore',
    },
};

// Every dotted path to a string leaf, for autocomplete and typo safety.
type Leaves<T> = {
    [K in keyof T & string]: T[K] extends string ? K : `${K}.${Leaves<T[K]>}`;
}[keyof T & string];
export type MessageKey = Leaves<Messages>;
