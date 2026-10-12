// The service card: a portrait card for one organisation — its name, its sector
// and the sector's icon over the card's hatched body.
//
// Used wherever an organisation is listed. It scales through three sizes and can
// carry a delete control (the trash button) for removable lists.
import { Pressable, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { CardBody, CardIcon, CardPatternedBackground } from '@/components/card/card-body';
import { CardContainer } from '@/components/card/card-container';
import { CardHeader, CardSubtitle, CardTitle } from '@/components/card/card-header';
import { SectorIcon, useSectorLabel } from '@/components/sectors';
import type { SelectedService } from '@/data/services';
import { Colors, Radii, Spacing, Theme } from '@/theme/tokens';

export type OrganisationCardSize = 'small' | 'medium' | 'large';

// The card's box per size. Exported so layouts that arrange several cards (like
// the fan) can measure them without duplicating the numbers.
export const CARD_DIMENSIONS: Record<OrganisationCardSize, { width: number; height: number }> = {
    small: { width: 130, height: 200 },
    medium: { width: 190, height: 300 },
    large: { width: 250, height: 400 },
};

// Each size: the card box, the icon that fills its body, the title and subtitle
// metrics, and the delete control.
const SIZES: Record<
    OrganisationCardSize,
    {
        card: ViewStyle;
        icon: { width: number; height: number };
        title: TextStyle;
        subtitle: TextStyle;
        remove: number;
    }
> = {
    small: {
        card: CARD_DIMENSIONS.small,
        icon: { width: 60, height: 80 },
        title: { fontSize: 16, lineHeight: 15 },
        subtitle: { fontSize: 12, lineHeight: 15 },
        remove: 24,
    },
    medium: {
        card: CARD_DIMENSIONS.medium,
        icon: { width: 90, height: 120 },
        title: { fontSize: 24, lineHeight: 22 },
        subtitle: { fontSize: 16, lineHeight: 22 },
        remove: 28,
    },
    large: {
        card: CARD_DIMENSIONS.large,
        icon: { width: 130, height: 170 },
        title: { fontSize: 30, lineHeight: 28 },
        subtitle: { fontSize: 20, lineHeight: 26 },
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
    muted = false,
}: {
    organisation: SelectedService;
    /** When given, shows the trash control and calls this to remove the card. */
    onDelete?: () => void;
    /** Card scale. */
    size?: OrganisationCardSize;
    /** Dims the whole card, e.g. once it has been chosen and shown elsewhere. */
    muted?: boolean;
}) {
    const sector = organisation.classifications?.[0]?.sector;
    const sectorLabel = useSectorLabel();
    const metrics = SIZES[size];
    const trash = Math.round(metrics.remove * 0.6);

    return (
        <CardContainer style={[metrics.card, muted && styles.muted]}>
            <CardHeader>
                <CardTitle numberOfLines={2} style={metrics.title}>
                    {organisation.name}
                </CardTitle>
                <CardSubtitle style={metrics.subtitle}>{sector ? sectorLabel(sector) : ''}</CardSubtitle>
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
    muted: {
        opacity: 0.4,
    },
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
