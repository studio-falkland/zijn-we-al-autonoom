// A navy pill label under each step of the outro diagram (non-interactive).

import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radii, Type } from '@/theme/tokens';

export function StepPill({ label }: { label: string }) {
    return (
        <View style={styles.pill}>
            <Text style={styles.label}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    pill: {
        backgroundColor: Colors.blue[800],
        borderRadius: Radii.pill,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    label: {
        ...Type.body,
        color: Colors.white,
    },
});
