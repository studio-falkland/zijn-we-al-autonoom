// The utility providers serving a visitor's location: the netbeerder for
// electricity and gas, the drinkwaterbedrijf, and the waterschap.
//
// Everything is keyed on the PDOK document's own coordinates, so there is no
// gemeente lookup and no hardcoded table:
// - netbeerder (elektriciteit/gas) and drinkwater come from Stichting Mijn
//   Aansluiting's public OGC WFS ("Netbeheergebieden", via het Nationaal
//   Georegister), queried as a point-in-area test in RD (EPSG:28992);
// - the waterschap comes from the PDOK Locatieserver reverse geocoder.
import { reverseWaterschap, type PdokDoc } from './places';

// The GeoServer publishing a netbeheer layer per discipline.
const WFS = 'https://public.geodata.mijnaansluiting.nl/geoserver/mijnaansluiting_open/wfs';

// WFS layer suffixes. `elektriciteit`/`gas` feed the netbeerder, `water` the
// drinkwaterbedrijf.
type Discipline = 'elektriciteit' | 'gas' | 'water';

// The visitor's providers; a field is null when its source has no area for the
// point (or the point's coordinate is missing).
export type Utilities = {
    netbeheerderElektra: string | null;
    netbeheerderGas: string | null;
    drinkwater: string | null;
    waterschap: string | null;
};

// Parse PDOK "POINT(x y)" WKT; used for both the WGS84 and the RD centroids.
function parsePoint(wkt: string | undefined): [number, number] | null {
    const match = /POINT\(([-\d.]+) ([-\d.]+)\)/.exec(wkt ?? '');
    return match ? [Number(match[1]), Number(match[2])] : null;
}

// The netbeheer area containing an RD (EPSG:28992) point. PDOK's `centroide_rd`
// is already in RD, matching the layer's native CRS, so the point query needs no
// reprojection. Returns the operator's display label, or null on a failed request.
async function fetchNetbeheerder(discipline: Discipline, rd: [number, number]): Promise<string | null> {
    const params = new URLSearchParams({
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeNames: `mijnaansluiting_open:netbeheergebieden_${discipline}`,
        outputFormat: 'application/json',
        propertyName: 'netbeheerderLabel',
        CQL_FILTER: `INTERSECTS(geom,POINT(${rd[0]} ${rd[1]}))`,
    });

    const response = await fetch(`${WFS}?${params}`);
    if (!response.ok) return null;

    const data = await response.json();
    return data.features?.[0]?.properties?.netbeheerderLabel ?? null;
}

// Resolve all four providers for a PDOK location document. The two centroids are
// independent, so the four lookups run concurrently. They are also settled
// independently, so one failing source (the WFS going unreachable, say) does not
// discard the providers the others did resolve.
export async function resolveUtilities(pdok: PdokDoc): Promise<Utilities> {
    const rd = parsePoint(pdok.centroide_rd);
    const ll = parsePoint(pdok.centroide_ll);

    const [elektra, gas, water, waterschap] = await Promise.allSettled([
        rd ? fetchNetbeheerder('elektriciteit', rd) : Promise.resolve(null),
        rd ? fetchNetbeheerder('gas', rd) : Promise.resolve(null),
        rd ? fetchNetbeheerder('water', rd) : Promise.resolve(null),
        ll ? reverseWaterschap(ll[0], ll[1]) : Promise.resolve(null),
    ]);

    // A rejected lookup is a missing provider, same as a null answer.
    const value = (result: PromiseSettledResult<string | null>) =>
        result.status === 'fulfilled' ? result.value : null;

    return {
        netbeheerderElektra: value(elektra),
        netbeheerderGas: value(gas),
        drinkwater: value(water),
        waterschap: value(waterschap),
    };
}
