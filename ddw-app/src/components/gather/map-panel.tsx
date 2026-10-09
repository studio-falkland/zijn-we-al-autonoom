// The gather section's fixed layout: the map fills the left two-thirds and the
// step's panel sits on the right.
//
// Screens pass their own `map` and `panel` nodes, so each step can drive the map
// differently (tap, layers, camera) while this geometry stays identical.
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing, Theme } from '@/theme/tokens';

export function MapPanel({ map, panel }: { map: ReactNode; panel: ReactNode }) {
    return (
        <View style={styles.row}>
            {/* Left two-thirds: the map, free to fill its column. */}
            <View style={styles.map}>{map}</View>
            {/* Right third: the step's panel, vertically centered. */}
            <View style={styles.panel}>{panel}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        backgroundColor: Theme.background,
        flex: 1,
        flexDirection: 'row',
    },
    map: {
        flex: 2,
    },
    panel: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: Spacing.xxl,
    },
});
