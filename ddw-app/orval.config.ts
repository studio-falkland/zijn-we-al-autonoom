// Orval config: generates the typed PDOK Locatieserver client straight from the
// public OpenAPI spec. Run with `pnpm generate:pdok`; the generated output is
// committed so the app never needs the spec at build time.
//
// The `swr` client emits BOTH the raw request functions (imperative calls) and
// the SWR hooks (state-driven search), so a single output covers both needs.
import { defineConfig } from 'orval';

export default defineConfig({
    pdok: {
        input: { target: 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/openapi.json' },
        output: {
            target: './src/data/pdok/generated.ts',
            client: 'swr',
            mode: 'single',
            clean: true,
            // Prefix every generated request with the spec's servers[0].url.
            baseUrl: { getBaseUrlFromSpecification: true },
        },
    },
});
