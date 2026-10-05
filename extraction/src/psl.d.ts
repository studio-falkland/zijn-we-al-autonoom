// psl ships types (types/index.d.ts) but its package.json "exports" map does
// not expose them, so this project-local declaration is required.
declare module 'psl' {
    interface ParsedDomain {
        input: string;
        tld: string | null;
        sld: string | null;
        domain: string | null;
        subdomain: string | null;
        listed: boolean;
        /** Present when parsing failed. */
        error?: { code: string; message: string };
    }

    const psl: {
        parse(input: string): ParsedDomain;
        get(domain: string): string | null;
        isValid(domain: string): boolean;
    };

    export default psl;
}
