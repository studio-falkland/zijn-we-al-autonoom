// Fixed design tokens for the DDW kiosk.
// Single light theme derived from the Figma file "DDW Zijn we al autonoom".
// No dark mode: the installation uses one fixed palette.

import { StyleSheet } from 'react-native';

// Brand palette from the Figma color variables (blue scale + red accent).
// Blue shades are nested under `blue`; semantic variants live alongside them.
export const Colors = {
    blue: {
        900: '#000066',
        800: '#0000AD',
        700: '#0000C2',
        500: '#0000FF',
        200: '#9999FF',
        50: '#F1F1F8',
        textbox: '#6468AA',
    },
    red: '#FB2C36',
    grey: {
        700: '#595969',
        200: '#c4c4d4',
    },
    white: '#FFFFFF',
} as const;

// Semantic aliases for kiosk surfaces, text, and interactive elements.
export const Theme = {
    background: Colors.blue[50],
    panel: Colors.blue[50],
    text: Colors.blue[900],
    textMuted: Colors.blue.textbox,
    primary: Colors.blue[500],
    primaryPressed: Colors.blue[700],
    danger: Colors.red,
    border: Colors.blue[200],
} as const;

// Spacing scale (4pt base) shared by every screen layout.
export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
} as const;

// Radii: the installation uses hard offset shadows, so corners stay sharp.
export const Radii = {
    none: 0,
    sm: 2,
    md: 4,
    lg: 8,
    pill: 999,
} as const;

// Font family embedded at build time via the expo-font config plugin (woff2 in assets/fonts).
export const Fonts = {
    family: 'Familjen Grotesk',
    regular: '400',
    bold: '700',
} as const;

// Hard offset shadows from the Figma effect styles (radius 0, 4px offset).
export const Shadows = StyleSheet.create({
    drop: {
        shadowColor: Colors.blue[800],
        shadowOffset: { width: 4, height: 4 },
        shadowRadius: 0,
        shadowOpacity: 1,
        elevation: 4,
    },
    box: {
        shadowColor: '#0000A1',
        shadowOffset: { width: 4, height: 4 },
        shadowRadius: 0,
        shadowOpacity: 1,
        elevation: 4,
    },
    // The website's smaller hard shadow, used on inputs.
    boxSmall: {
        shadowColor: '#0000A1',
        shadowOffset: { width: 2, height: 2 },
        shadowRadius: 0,
        shadowOpacity: 1,
        elevation: 2,
    },
    boxRed: {
        shadowColor: Colors.red,
        shadowOffset: { width: 4, height: 4 },
        shadowRadius: 0,
        shadowOpacity: 1,
        elevation: 4,
    },
});

// Type scale mirroring the Figma text styles (pt values, Familjen Grotesk).
export const Type = StyleSheet.create({
    hero: {
        color: Colors.blue[900],
        fontFamily: Fonts.family,
        fontWeight: Fonts.bold,
        fontSize: 64,
        lineHeight: 58,
        letterSpacing: -1.28
    },
    page: {
        color: Colors.blue[900],
        fontFamily: Fonts.family,
        fontWeight: Fonts.bold,
        fontSize: 40,
        lineHeight: 36,
        letterSpacing: -0.8
    },
    sub: {
        color: Colors.blue[900],
        fontFamily: Fonts.family,
        fontWeight: Fonts.bold,
        fontSize: 24,
        lineHeight: 22,
        letterSpacing: -0.24
    },
    bodyLarge: {
        color: Colors.blue[900],
        fontFamily: Fonts.family,
        fontWeight: Fonts.regular,
        fontSize: 24,
        lineHeight: 29,
        letterSpacing: -0.24
    },
    body: {
        color: Colors.blue[900],
        fontFamily: Fonts.family,
        fontWeight: Fonts.regular,
        fontSize: 16,
        lineHeight: 22,
        letterSpacing: 0
    },
    bodySmall: {
        color: Colors.blue[900],
        fontFamily: Fonts.family,
        fontWeight: Fonts.regular,
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: 0
    },
    cardTitle: {
        color: Colors.blue[900],
        fontFamily: Fonts.family,
        fontWeight: Fonts.regular,
        fontSize: 24,
        lineHeight: 17,
        letterSpacing: -0.24
    },
});
