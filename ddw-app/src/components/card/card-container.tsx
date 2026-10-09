// The card surface: white, navy ink stroke, and the brand's hard offset shadow.
// A pure surface — it adds no padding, so sections own their own insets and
// edge-to-edge children (like CardPatternedBackground) can reach the border.
// Takes any View props, so callers can size and space the card with `style`.
import { StyleSheet, View, type ViewProps } from 'react-native';

import { Colors, Radii, Shadows } from '@/theme/tokens';

// The card's stroke width. CardBody rounds its corners by the same inset, so
// its clip lines up with the surface's inner curve.
export const CARD_BORDER_WIDTH = 2;

export function CardContainer({ style, ...props }: ViewProps) {
    return <View style={[styles.container, style]} {...props} />;
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.white,
        borderColor: Colors.blue[800],
        borderRadius: Radii.lg,
        borderWidth: CARD_BORDER_WIDTH,
        ...Shadows.box,
    },
});
