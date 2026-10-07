// The treemap's vector patterns rendered to react-native-svg.
// The pattern/mask definitions live in patternDefs.ts (the single source of
// truth); this file only maps them onto RN-SVG primitives. The print HTML
// serializes the same defs to inline SVG from patternDefs.ts.

import { Defs, Mask, Path, Pattern, Rect } from 'react-native-svg';

import type { PatternDef } from './patternDefs';
import { patternDefs, scaledPatternDef } from './patternDefs';

export type { PatternDef };
export { PatternMatcher, US_AS } from './patternDefs';

// One pattern tile plus the mask that punches it through a fill.
function DefItem({ def }: { def: PatternDef }) {
    // The scale is baked into the tile size and path data, matching the print
    // serializer (patternTransform is unreliable in WebKit's print pipeline).
    const scaled = scaledPatternDef(def);

    return (
        <>
            <Pattern id={def.id} patternUnits="userSpaceOnUse" width={scaled.width} height={scaled.height}>
                {scaled.paths.map((path, i) => (
                    <Path
                        key={i}
                        d={path.d}
                        fill={path.fill}
                        stroke={path.stroke}
                        fillRule={path.fillRule}
                        clipRule={path.clipRule}
                    />
                ))}
            </Pattern>
            <Mask id={`${def.id}-mask`} x={0} y={0} width={1} height={1}>
                <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${def.id})`} />
            </Mask>
        </>
    );
}

// The full defs block: the hatch patterns and the three hyperscaler logos.
export default function TreemapPatterns() {
    return <Defs>{patternDefs.map((def) => <DefItem key={def.id} def={def} />)}</Defs>;
}
