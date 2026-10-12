// i18n for the kiosk: one shared i18n-js instance behind a small API.
//
// `translate` is for plain (non-React) code such as the print pipeline; React
// components use `useTranslation` (see ./use-translation) so they re-render when
// the visitor switches language on the start screen.
import { I18n } from 'i18n-js';

import { translations, type Language, type MessageKey } from './messages';

// The languages the kiosk offers, re-exported for consumers (the language tabs).
export { LANGUAGES, type Language } from './messages';

// Dutch is the installation's default; a visitor can switch on the start screen.
export const DEFAULT_LANGUAGE: Language = 'nl';

// One shared instance. `enableFallback` keeps a missing translation from showing
// a placeholder, falling back to the default language instead.
const i18n = new I18n(translations, { defaultLocale: DEFAULT_LANGUAGE, enableFallback: true });

// Translate a key in a given language. Pinning the locale here keeps the shared
// instance in step with the session store on every call.
export function translate(
    language: Language,
    key: MessageKey,
    params?: Record<string, string | number>,
): string {
    i18n.locale = language;
    // Call `t` on the instance: i18n-js binds `translate` to `i18n`, so a
    // detached reference would lose its `this`.
    return i18n.t(key, params);
}

export type { MessageKey } from './messages';
