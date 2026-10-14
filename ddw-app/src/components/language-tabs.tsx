// The start screen's language selector: two tabs, NL for Dutch and EN for
// English. The short code is shown visually, with the full language named for
// screen readers.
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LANGUAGES, type Language } from '@/i18n';
import { useTranslation } from '@/i18n/use-translation';
import { Colors, Radii, Shadows, Spacing } from '@/theme/tokens';

// The short code and full name per language, keyed by the store's language value.
const TABS: Record<Language, { code: string; label: string }> = {
    nl: { code: 'NL', label: 'Nederlands' },
    en: { code: 'EN', label: 'English' },
};

export function LanguageTabs() {
    const { language, setLanguage } = useTranslation();

    return (
        <View style={styles.row}>
            {LANGUAGES.map((value) => {
                const selected = value === language;
                return (
                    <Pressable
                        key={value}
                        onPress={() => setLanguage(value)}
                        accessibilityRole="tab"
                        accessibilityState={{ selected }}
                        accessibilityLabel={TABS[value].label}
                        style={[styles.tab, selected && styles.tabSelected]}
                    >
                        <Text style={styles.code}>{TABS[value].code}</Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    // The unselected tab: white with the brand's ink stroke and hard shadow.
    tab: {
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderColor: Colors.blue[800],
        borderRadius: Radii.md,
        borderWidth: 1,
        height: 56,
        justifyContent: 'center',
        width: 56,
        ...Shadows.boxSmall,
    },
    // The selected tab: filled with the brand blue.
    tabSelected: {
        backgroundColor: Colors.blue[700],
    },
    code: {
        color: Colors.blue[800],
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 22,
    },
});
