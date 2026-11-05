import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const size = { width: 1200, height: 630 };

/**
 * The logo, fonts and map art are identical for every generated image. They are
 * read (and base64-encoded) once per process instead of once per image, so the
 * build does not repeat the same disk I/O for all ~13k organisation images.
 */
let assetsPromise: ReturnType<typeof loadAssets> | undefined;

function loadAssets() {
    return Promise.all([
        readFile(join(process.cwd(), 'public/logo.svg')),
        readFile(join(process.cwd(), 'public/fonts/FamiljenGrotesk-SemiBold.otf')),
        readFile(join(process.cwd(), 'public/fonts/FamiljenGrotesk-Regular.otf')),
        readFile(join(process.cwd(), 'public/nl-map-art.png')),
    ]).then(([logoData, fontSemiBoldData, fontRegularData, mapArtData]) => ({
        logoSrc: `data:image/svg+xml;base64,${logoData.toString('base64')}`,
        mapArtSrc: `data:image/png;base64,${mapArtData.toString('base64')}`,
        fonts: [
            {
                name: 'Familjen Grotesk',
                data: fontSemiBoldData,
                style: 'normal' as const,
                weight: 600 as const,
            },
            {
                name: 'Familjen Grotesk',
                data: fontRegularData,
                style: 'normal' as const,
                weight: 400 as const,
            },
        ],
    }));
}

export function getAssets() {
    assetsPromise ??= loadAssets();
    return assetsPromise;
}

export function sanitizeText(text: string): string {
    // Remove replacement characters and other problematic characters
    return text
        .replace(/\uFFFD/g, '') // � replacement character
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Control characters
        .normalize('NFC'); // Normalize unicode
}

export interface OpenGraphImageProps {
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
}

/**
 * Create an Open Graph image for a given title, subtitle and measurements.
 */
export async function createOpenGraphImage({
    title,
    subtitle,
    children
}: OpenGraphImageProps) {
    const { logoSrc, mapArtSrc, fonts } = await getAssets();

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f1f1f8',
                    fontFamily: 'Familjen Grotesk, Inter',
                    padding: '20px',
                }}
            >
                <img
                    src={mapArtSrc}
                    height="120%"
                    style={{
                        position: 'absolute',
                        top: 20,
                        right: -140,
                    }}
                />
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: '24px',
                        padding: '40px',
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <img src={logoSrc} height="40" style={{ marginBottom: 40, marginLeft: -42 }} />

                    <div
                        style={{
                            fontSize: 72,
                            fontWeight: 600,
                            color: '#0000A1',
                            marginBottom: subtitle ? 20 : 0,
                            lineHeight: 1.2,
                            marginTop: 'auto',
                            maxWidth: '66%',
                            letterSpacing: -1,
                        }}
                    >
                        {sanitizeText(title)}
                    </div>
                    {subtitle && (
                        <div
                            style={{
                                fontSize: 24,
                                color: '#0000A1',
                                lineHeight: 1.3,
                                maxWidth: '50%',
                            }}
                        >
                            {sanitizeText(subtitle)}
                        </div>
                    )}
                    {children ?? null}
                </div>
            </div>
        ),
        {
            ...size,
            fonts,
        }
    );
}

