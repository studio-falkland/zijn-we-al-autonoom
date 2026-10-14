// Start screen: the pixelated Netherlands artwork fills the left two-thirds,
// while the wordmark, the invitation copy, and the start button sit in a
// vertically centered column on the right. A tiny settings window in the corner
// holds the developer options (currently the PDF preview toggle).
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Logo from '@/assets/images/logo.svg';
import MapArt from '@/assets/images/nl-map-art.png';
import { Button } from '@/components/button';
import { LanguageTabs } from '@/components/language-tabs';
import { useTranslation } from '@/i18n/use-translation';
import { useSessionStore } from '@/store/session';
import { Colors, Radii, Spacing, Theme, Type } from '@/theme/tokens';

export default function StartScreen() {
    const { t } = useTranslation();
    const previewPdf = useSessionStore((state) => state.previewPdf);
    const setPreviewPdf = useSessionStore((state) => state.setPreviewPdf);
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <SafeAreaView style={styles.screen}>
            {/* The settings affordance: deliberately small, in the top corner. */}
            <Pressable style={styles.gear} onPress={() => setSettingsOpen(true)} accessibilityLabel={t('settings.title')}>
                <Text style={styles.gearIcon}>⚙</Text>
            </Pressable>
            <View style={styles.row}>
                {/* Left two-thirds: the map artwork, contained and vertically centered. */}
                <View style={styles.artWrap}>
                    <Image source={MapArt} style={styles.art} contentFit="contain" />
                </View>
                {/* Right third: wordmark, copy, and action as one centered column. */}
                <View style={styles.panel}>
                    <LanguageTabs />
                    <Image source={Logo} style={styles.logo} contentFit="contain" />
                    <Text style={styles.sub}>{t('intro.body1')}</Text>
                    <Text style={styles.sub}>{t('intro.body2')}</Text>
                    <Button label={t('intro.start')} onPress={() => router.push('/gather')} />
                </View>
            </View>
            {/* The settings window: a small centered panel, dismissed by tapping out. */}
            <Modal transparent visible={settingsOpen} animationType="fade" onRequestClose={() => setSettingsOpen(false)}>
                <Pressable style={styles.backdrop} onPress={() => setSettingsOpen(false)}>
                    <Pressable style={styles.settingsPanel} onPress={() => {}}>
                        <Text style={styles.settingsTitle}>{t('settings.title')}</Text>
                        <View style={styles.settingRow}>
                            <Text style={styles.settingLabel}>{t('settings.previewPdf')}</Text>
                            <Switch value={previewPdf} onValueChange={setPreviewPdf} />
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: Theme.background,
    },
    row: {
        flex: 1,
        flexDirection: 'row',
    },
    artWrap: {
        flex: 3,
        padding: Spacing.xxxl,
    },
    art: {
        flex: 1,
    },
    logo: {
        width: 280,
        aspectRatio: 189 / 17,
        marginLeft: -24,
    },
    panel: {
        flex: 2,
        alignItems: 'flex-start',
        gap: Spacing.xl,
        justifyContent: 'center',
        paddingHorizontal: Spacing.xxl,
    },
    heading: {
        ...Type.page,
    },
    sub: {
        ...Type.bodyLarge,
    },
    gear: {
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderColor: Colors.blue[200],
        borderRadius: Radii.sm,
        borderWidth: 1,
        height: 28,
        justifyContent: 'center',
        position: 'absolute',
        right: Spacing.md,
        top: Spacing.md,
        width: 28,
        zIndex: 1,
    },
    gearIcon: {
        color: Colors.blue[800],
        fontSize: 16,
        lineHeight: 18,
    },
    backdrop: {
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.35)',
        flex: 1,
        justifyContent: 'center',
    },
    settingsPanel: {
        backgroundColor: Colors.white,
        borderColor: Colors.blue[800],
        borderRadius: Radii.md,
        borderWidth: 1,
        gap: Spacing.md,
        padding: Spacing.md,
        width: 240,
    },
    settingsTitle: {
        ...Type.body,
        fontWeight: 700,
    },
    settingRow: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    settingLabel: {
        ...Type.bodySmall,
    },
});
