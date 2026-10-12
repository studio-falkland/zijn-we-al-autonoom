// The start screen's language selector: two tabs, 🧀 for Dutch and 🍔 for
// English. Emoji-only visually, with the language named for screen readers.
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LANGUAGES, type Language } from '@/i18n';
import { useTranslation } from '@/i18n/use-translation';
import { Colors, Radii, Shadows, Spacing } from '@/theme/tokens';

// The emoji and full name per language, keyed by the store's language value.
const TABS: Record<Language, { emoji: string; label: string }> = {
    nl: { emoji: '🧀', label: 'Nederlands' },
    en: { emoji: '🍔', label: 'English' },
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
                        <Text style={styles.emoji}>{TABS[value].emoji}</Text>
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
    emoji: {
        fontSize: 28,
        lineHeight: 34,
    },
});
