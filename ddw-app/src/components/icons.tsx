// The service icons, one per sector, drawn from the DDW icon sprite.
// The source is a single 1680×153 strip (#000066 strokes on white); each
// component below is cropped to its icon's slice of that strip via its own
// viewBox, so the path data is unchanged.
//
// Every icon is drawn in the brand blue with a hard offset drop shadow: the
// same paths rendered once as a solid silhouette, shifted, and a second time
// as the stroked/white-filled icon on top. Both the stroke and the shadow
// colour (and the offset) are props, so callers can restyle a single icon.
//
// Intended pairing: utilities_power → EnergyIcon, utilities_water → WaterIcon,
// government_* → GovernmentIcon, education_* → EducationIcon, healthcare_* →
// HealthIcon, shopping → ShoppingIcon, the visitor → PersonIcon.
import { G, Path, Svg, type SvgProps } from 'react-native-svg';

import { Colors } from '@/theme/tokens';

const SURFACE = Colors.white;

// One path in an icon. `fill` marks the white-filled silhouette paths; `stroke`
// (default true) marks the inked outlines. The shadow reuses every path as a
// solid shape, so only the drawn layer needs these flags.
type IconShape = { d: string; fill?: boolean; stroke?: boolean };

// One icon: the frame lays out the shadow and the icon over the same shapes.
function IconFrame({
    viewBox,
    shapes,
    ink = Colors.blue[800],
    shadow = Colors.blue[900],
    shadowOffset = 4,
    width = 48,
    height = 48,
    ...props
}: SvgProps & {
    viewBox: string;
    shapes: IconShape[];
    /** Stroke colour of the icon. */
    ink?: string;
    /** Colour of the hard offset drop shadow. */
    shadow?: string;
    /** Shadow offset in viewBox units. */
    shadowOffset?: number;
}) {
    // Grow the frame by the offset so the shadow is never clipped.
    const [x, y, w, h] = viewBox.split(' ').map(Number);

    return (
        <Svg viewBox={`${x} ${y} ${w + shadowOffset} ${h + shadowOffset}`} width={width} height={height} fill="none" {...props}>
            {/* The drop shadow: every path as a solid silhouette, offset. */}
            <G transform={`translate(${shadowOffset}, ${shadowOffset})`} strokeWidth={2} strokeMiterlimit={10} strokeLinecap="square">
                {shapes.map((shape, index) => (
                    <Path key={index} d={shape.d} fill={shadow} stroke={shadow} />
                ))}
            </G>
            {/* The icon: blue strokes with white fills. */}
            <G strokeWidth={2} strokeMiterlimit={10} strokeLinecap="square">
                {shapes.map((shape, index) => (
                    <Path
                        key={index}
                        d={shape.d}
                        fill={shape.fill ? SURFACE : 'none'}
                        stroke={shape.stroke === false ? 'none' : ink}
                    />
                ))}
            </G>
        </Svg>
    );
}

// utilities_power
export function EnergyIcon(props: SvgProps) {
    return (
        <IconFrame
            viewBox="27 24 66 106"
            shapes={[
                {
                    d: 'M52.277 129.266L92 68.9044H56.1988L78.077 25.2656H36.6318L28 86.2442H65.4362L52.277 129.266Z',
                    fill: true,
                },
            ]}
            {...props}
        />
    );
}

// utilities_water
export function WaterIcon(props: SvgProps) {
    return (
        <IconFrame
            viewBox="299 28 74 104"
            shapes={[
                {
                    d: 'M312.641 117.392C302.175 107.169 300.01 91.6592 307.228 79.3215L335.736 29.2656L364.244 79.674C371.461 92.0117 368.935 107.522 358.831 117.745C345.84 130.082 325.271 130.082 312.641 117.392Z',
                    fill: true,
                },
                { d: 'M352.696 74.7393L354.861 77.9118' },
                { d: 'M336.458 45.833L348.367 66.9834' },
            ]}
            {...props}
        />
    );
}

// government_*
export function GovernmentIcon(props: SvgProps) {
    return (
        <IconFrame
            viewBox="560 27 103 102"
            shapes={[
                {
                    d: 'M662.048 57.4034L611.846 28.6162L561.644 57.4034H576.704V115.68H565.229V127.265H657.745V115.68H646.629V57.4034H662.048Z',
                    fill: true,
                    stroke: false,
                },
                { d: 'M561.285 57.4039L611.487 28.2656L662.048 57.4039H561.285Z' },
                { d: 'M599.654 57.4043H576.346V115.681H599.654V57.4043Z' },
                { d: 'M646.629 57.4043H623.321V115.681H646.629V57.4043Z' },
                { d: 'M657.704 126.816V115.23L565.189 115.23V126.816L657.704 126.816Z' },
            ]}
            {...props}
        />
    );
}

// education_*
export function EducationIcon(props: SvgProps) {
    return (
        <IconFrame
            viewBox="840 33 97 89"
            shapes={[
                {
                    d: 'M888.667 48.304L888.319 48.6558L887.971 48.304C874.402 38.4536 857.353 34.9356 841 38.8054V110.572C857.353 106.703 874.402 110.221 887.623 120.423L887.971 120.775L888.319 120.423C901.888 110.572 918.937 107.054 934.942 110.572V38.8054C919.285 34.9356 901.888 38.4536 888.667 48.304Z',
                    fill: true,
                    stroke: false,
                },
                { d: 'M841 38.8054V103.536C857.353 99.6667 874.402 103.185 887.623 113.387L887.971 113.739V48.6558L887.623 48.304C874.402 38.4536 857.353 34.9356 841 38.8054Z' },
                { d: 'M935.289 38.8054V103.536C918.937 99.6667 901.888 103.185 888.666 113.387L888.318 113.739V48.6558L888.666 48.304C901.888 38.4536 919.284 34.9356 935.289 38.8054Z' },
                { d: 'M841 103.185V110.572C857.353 106.703 874.402 110.221 887.623 120.423L887.971 120.775L888.319 120.423C901.888 110.572 918.937 107.054 934.942 110.572V103.185' },
            ]}
            {...props}
        />
    );
}

// healthcare_*
export function HealthIcon(props: SvgProps) {
    return (
        <IconFrame
            viewBox="1119 32 91 91"
            shapes={[
                {
                    d: 'M1208.35 61.7325H1179.88V33.2656H1148.47V61.7325H1120V93.1443H1148.47V121.611H1179.88V93.1443H1208.35V61.7325Z',
                    fill: true,
                },
            ]}
            {...props}
        />
    );
}

// shopping
export function ShoppingIcon(props: SvgProps) {
    return (
        <IconFrame
            viewBox="1384 27 112 100"
            shapes={[
                {
                    d: 'M1467.74 57.4318C1467.74 41.9165 1455.22 29.2878 1439.84 29.2878C1424.11 28.927 1411.59 41.5557 1411.59 57.4318H1385.49L1407.3 125.266H1472.75L1494.2 57.4318H1467.74ZM1419.82 57.4318C1419.82 46.2463 1428.76 37.5867 1439.49 37.5867C1450.57 37.5867 1459.16 46.6072 1459.16 57.4318H1419.82Z',
                    fill: true,
                    stroke: false,
                },
                { d: 'M1451.65 125.266L1459.51 57.4316' },
                { d: 'M1419.82 57.4316L1427.69 125.266' },
                { d: 'M1385.49 57.4316H1494.2L1472.39 125.266H1406.94L1385.49 57.4316Z' },
                { d: 'M1396.21 91.3486H1483.47' },
                { d: 'M1467.74 57.432C1467.74 41.9168 1455.22 29.2881 1439.84 29.2881C1424.47 29.2881 1411.59 41.556 1411.59 57.432' },
                { d: 'M1419.82 57.432C1419.82 46.2466 1428.76 37.5869 1439.49 37.5869C1450.22 37.5869 1459.16 46.6074 1459.16 57.432' },
            ]}
            {...props}
        />
    );
}

// the visitor
export function PersonIcon(props: SvgProps) {
    return (
        <IconFrame
            viewBox="1626 0 54 153"
            shapes={[
                {
                    d: 'M1653 1C1660.18 1 1666 6.8203 1666 14C1666 21.1797 1660.18 27 1653 27C1645.82 27 1640 21.1797 1640 14C1640 6.8203 1645.82 1 1653 1Z',
                    fill: true,
                },
                {
                    d: 'M1656.72 34C1669.19 34.0003 1679 43.9322 1679 56.6221V94.3623H1668.76V152H1656.79V98.1973C1656.79 97.1021 1656.52 96.0957 1655.81 95.3691C1655.09 94.6398 1654.09 94.3623 1653 94.3623C1651.91 94.3623 1650.91 94.6398 1650.19 95.3691C1649.48 96.0957 1649.21 97.1021 1649.21 98.1973V152H1637.24V94.3623H1627V56.6221C1627 44.9249 1636.77 34.9263 1649.31 34H1656.72Z',
                    fill: true,
                },
            ]}
            {...props}
        />
    );
}
