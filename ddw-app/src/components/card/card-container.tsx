// The card surface: white, navy ink stroke, and the brand's hard offset shadow.
// A pure surface — it adds no padding, so sections own their own insets and
// edge-to-edge children (like CardPatternedBackground) can reach the border.
// Takes any View props, so callers can size and space the card with `style`.
//
// The stroke is drawn as SVG rather than a View border. RN renders a visible,
// non-clipping border as a separate image layer with nearest-neighbour
// magnification (kCAFilterNearest), so it aliases badly once the card is
// transformed — the fanned hand and the flip. An SVG stroke is anti-aliased and
// resamples with the rest of the card art. The View border is kept, but
// transparent, only for the 2px layout inset CardBody and the mosaic rely on.
import { useCallback, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ViewProps } from 'react-native';
import { Rect, Svg } from 'react-native-svg';

import { Colors, Radii, Shadows } from '@/theme/tokens';

// The card's stroke width. CardBody rounds its corners by the same inset, so
// its clip lines up with the surface's inner curve.
export const CARD_BORDER_WIDTH = 2;

export function CardContainer({ style, children, ...props }: ViewProps) {
    // The SVG stroke needs the card's pixel size, which only layout knows. The
    // measured box is the border box, which is also the overlay's box (below).
    const [size, setSize] = useState<{ width: number; height: number } | null>(null);
    const handleLayout = useCallback((event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setSize({ width, height });
    }, []);

    return (
        <View style={[styles.container, style]} {...props} onLayout={handleLayout}>
            {children}
            {size && <CardBorder width={size.width} height={size.height} />}
        </View>
    );
}

// The navy stroke, as an SVG rounded rect. Absolute children sit inside the
// border box, so the overlay is pulled out by the stroke width to land on the
// card's true edge; the stroke then spans the outer 2px it always did, with its
// inner curve matching CardBody's clip.
function CardBorder({ width, height }: { width: number; height: number }) {
    const inset = CARD_BORDER_WIDTH / 2;
    return (
        <View pointerEvents="none" style={[styles.border, { left: -CARD_BORDER_WIDTH, top: -CARD_BORDER_WIDTH, width, height }]}>
            <Svg width={width} height={height}>
                <Rect
                    x={inset}
                    y={inset}
                    width={width - CARD_BORDER_WIDTH}
                    height={height - CARD_BORDER_WIDTH}
                    rx={Radii.lg - inset}
                    fill="none"
                    stroke={Colors.blue[800]}
                    strokeWidth={CARD_BORDER_WIDTH}
                />
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.white,
        // Transparent: kept only for the 2px content inset, so RN takes its
        // cheap (non-rasterised) border path. The visible stroke is CardBorder.
        borderColor: 'transparent',
        borderRadius: Radii.lg,
        borderWidth: CARD_BORDER_WIDTH,
        ...Shadows.box,
    },
    border: {
        position: 'absolute',
    },
});
