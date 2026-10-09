// Start screen: the pixelated Netherlands artwork fills the left two-thirds,
// while the wordmark, the invitation copy, and the start button sit in a
// vertically centered column on the right.
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Logo from '@/assets/images/logo.svg';
import MapArt from '@/assets/images/nl-map-art.png';
import { Button } from '@/components/button';
import { Spacing, Theme, Type } from '@/theme/tokens';

export default function StartScreen() {
    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.row}>
                {/* Left two-thirds: the map artwork, contained and vertically centered. */}
                <View style={styles.artWrap}>
                    <Image source={MapArt} style={styles.art} contentFit="contain" />
                </View>
                {/* Right third: wordmark, copy, and action as one centered column. */}
                <View style={styles.panel}>
                    <Image source={Logo} style={styles.logo} contentFit="contain" />
                    <Text style={styles.sub}>
                        Our society relies deeply on digital infrastructures.
                    </Text>
                    <Text style={styles.sub}>
                        Do you want to know how your daily life is influenced by these dependencies?
                    </Text>
                    <Button label="Start to explore" onPress={() => router.push('/gather')} />
                </View>
            </View>
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
});
