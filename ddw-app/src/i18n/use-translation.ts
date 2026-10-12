// The component-facing translation API.
//
// `t` is bound to the session's current language, so any component that calls
// this hook re-renders (and re-translates) when the visitor switches language.
import { useCallback } from 'react';

import { translate, type MessageKey } from '@/i18n';
import { useSessionStore } from '@/store/session';

export function useTranslation() {
    const language = useSessionStore((state) => state.language);
    const setLanguage = useSessionStore((state) => state.setLanguage);

    // Rebind whenever the language changes so every lookup uses the new locale.
    const t = useCallback(
        (key: MessageKey, params?: Record<string, string | number>) => translate(language, key, params),
        [language],
    );

    return { t, language, setLanguage };
}
