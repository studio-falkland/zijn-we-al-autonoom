// The service card: a portrait card for one organisation — its name, its sector
// and the sector's icon over the card's hatched body.
//
// Used wherever an organisation is listed. It scales through three sizes and can
// carry a delete control (the trash button) for removable lists.
import type { Organisation } from '@are-we-dependent/data';
import { Pressable, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { CardBody, CardIcon, CardPatternedBackground } from '@/components/card/card-body';
import { CardContainer } from '@/components/card/card-container';
import { CardHeader, CardSubtitle, CardTitle } from '@/components/card/card-header';
import { SectorIcon, sectorLabel } from '@/components/sectors';
import { Colors, Radii, Spacing, Theme } from '@/theme/tokens';

export type OrganisationCardSize = 'small' | 'medium' | 'large';

// Each size: the card box, the icon that fills its body, the title metrics and
// the delete control.
const SIZES: Record<
    OrganisationCardSize,
    { card: ViewStyle; icon: { width: number; height: number }; title: TextStyle; remove: number }
> = {
    small: {
        card: { height: 200, width: 130 },
        icon: { width: 60, height: 80 },
        title: { fontSize: 16, lineHeight: 15 },
        remove: 24,
    },
    medium: {
        card: { height: 300, width: 190 },
        icon: { width: 90, height: 120 },
        title: { fontSize: 24, lineHeight: 22 },
        remove: 28,
    },
    large: {
        card: { height: 400, width: 250 },
        icon: { width: 130, height: 170 },
        title: { fontSize: 30, lineHeight: 28 },
        remove: 32,
    },
};

// The trash glyph (lucide's "trash-2").
function TrashIcon({ size }: { size: number }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M3 6h18" stroke={Theme.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <Path
                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
                stroke={Theme.textMuted}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                stroke={Theme.textMuted}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path d="M10 11v6" stroke={Theme.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M14 11v6" stroke={Theme.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

export function OrganisationCard({
    organisation,
    onDelete,
    size = 'medium',
}: {
    organisation: Organisation;
    /** When given, shows the trash control and calls this to remove the card. */
    onDelete?: () => void;
    /** Card scale. */
    size?: OrganisationCardSize;
}) {
    const sector = organisation.classifications?.[0]?.sector;
    const metrics = SIZES[size];
    const trash = Math.round(metrics.remove * 0.6);

    return (
        <CardContainer style={metrics.card}>
            <CardHeader>
                <CardTitle numberOfLines={2} style={metrics.title}>
                    {organisation.name}
                </CardTitle>
                <CardSubtitle>{sector ? sectorLabel(sector) : ''}</CardSubtitle>
            </CardHeader>
            <CardBody>
                <CardPatternedBackground />
                {sector && (
                    <CardIcon>
                        <SectorIcon sector={sector} width={metrics.icon.width} height={metrics.icon.height} />
                    </CardIcon>
                )}
            </CardBody>
            {/* The delete control floats over the card, so it never narrows the
                header's text. */}
            {onDelete && (
                <Pressable
                    onPress={onDelete}
                    hitSlop={8}
                    style={({ pressed }) => [
                        styles.remove,
                        { height: metrics.remove, width: metrics.remove },
                        pressed && styles.removePressed,
                    ]}
                >
                    <TrashIcon size={trash} />
                </Pressable>
            )}
        </CardContainer>
    );
}

const styles = StyleSheet.create({
    remove: {
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderColor: Theme.border,
        borderRadius: Radii.sm,
        borderWidth: 1,
        justifyContent: 'center',
        position: 'absolute',
        right: Spacing.sm,
        top: Spacing.sm,
    },
    removePressed: {
        backgroundColor: Colors.blue[50],
    },
});
