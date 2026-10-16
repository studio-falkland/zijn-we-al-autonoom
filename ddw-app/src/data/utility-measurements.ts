// The dependency measurements for the utility providers the app inserts by name:
// the grid operators and the drinkwater company. Unlike every other provider they
// have no organisation row of their own, so they carry no stored measurements and
// would otherwise be missing from the card.
//
// These are a point-in-time snapshot of what the extraction measures for an
// operator's website — one webhosting-as and one email-as leaf, from an
// MX/A -> IP -> ASN lookup (MaxMind MMDB -> CAIDA). Hosting changes over time.

// One measured dependency: the AS that hosts one dataset type.
type UtilityLeaf = {
    asn: number;
    as_country_code: string;
    as_organisation: string;
};

// The AS organisations the lookup resolved to, one constant per organisation.
const MICROSOFT: UtilityLeaf = { asn: 8075, as_country_code: 'US', as_organisation: 'Microsoft Corporation' };
const CLOUDFLARE: UtilityLeaf = { asn: 13335, as_country_code: 'US', as_organisation: 'Cloudflare, Inc.' };
const DIGITALOCEAN: UtilityLeaf = { asn: 14061, as_country_code: 'US', as_organisation: 'DigitalOcean, LLC' };
const PREVIDER: UtilityLeaf = { asn: 20847, as_country_code: 'NL', as_organisation: 'Previder B.V.' };
const VITENS: UtilityLeaf = { asn: 56517, as_country_code: 'NL', as_organisation: 'Vitens N.V.' };
const BRABANT_WATER: UtilityLeaf = { asn: 201644, as_country_code: 'NL', as_organisation: 'Brabant Water N.V' };
const SOUTHERNHILL: UtilityLeaf = { asn: 200428, as_country_code: 'NL', as_organisation: 'SouthernHill BV' };
const OSSO: UtilityLeaf = { asn: 43366, as_country_code: 'NL', as_organisation: 'OSSO B.V.' };

// A provider's two measured datasets, keyed by the exact label the utility lookup
// returns: the WFS netbeheerderLabel, or the drinkwater company's name.
type UtilityMeasurement = {
    web: UtilityLeaf;
    email: UtilityLeaf;
};

// Every operator sends mail via Microsoft 365; only the web host differs. The
// grid operators come first, then the drinkwater companies.
export const UTILITY_MEASUREMENTS: Record<string, UtilityMeasurement> = {
    Liander: { email: MICROSOFT, web: MICROSOFT },
    Enexis: { email: MICROSOFT, web: MICROSOFT },
    Stedin: { email: MICROSOFT, web: MICROSOFT },
    Coteq: { email: MICROSOFT, web: PREVIDER },
    Rendo: { email: MICROSOFT, web: DIGITALOCEAN },
    'Westland Infra': { email: MICROSOFT, web: CLOUDFLARE },
    Vitens: { email: MICROSOFT, web: VITENS },
    Evides: { email: MICROSOFT, web: MICROSOFT },
    Dunea: { email: MICROSOFT, web: MICROSOFT },
    PWN: { email: MICROSOFT, web: MICROSOFT },
    'Brabant Water': { email: MICROSOFT, web: BRABANT_WATER },
    Waternet: { email: MICROSOFT, web: CLOUDFLARE },
    Oasen: { email: MICROSOFT, web: MICROSOFT },
    WML: { email: MICROSOFT, web: SOUTHERNHILL },
    WMD: { email: MICROSOFT, web: OSSO },
    'Waterbedrijf Groningen': { email: MICROSOFT, web: OSSO },
};
