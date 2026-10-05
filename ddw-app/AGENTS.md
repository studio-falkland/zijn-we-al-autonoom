This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

This repo uses **pnpm** (root `pnpm-lock.yaml`, `pnpm-workspace.yaml`). Run everything through the package scripts in `ddw-app/package.json`; never invoke `expo` or `tsc` directly, and never `npm install`.

```bash
pnpm start                   # start the dev server
pnpm lint                    # lint
pnpm typecheck               # typecheck
pnpm doctor                  # diagnose dependency and config issues
pnpm expo:install <package>  # ALWAYS use instead of pnpm add — resolves SDK-compatible versions
pnpm expo:install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building locally — never use EAS

All builds happen locally on the dev machine. No EAS, no cloud builds, no `eas` commands. The kiosk iPad gets builds installed directly over USB.

```bash
pnpm build:ios         # build & install a development build on a connected iPad
pnpm build:ios:release # production-style kiosk build
pnpm start             # dev server for iteration
```

Never ship updates over the air.

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build built locally via the package scripts (`pnpm build:ios`).
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

# Architecture — DDW installation app

This app runs on an iPad built into an installation at Dutch Design Week. The installation contains a large printed map of the Netherlands. Flow: the visitor finds their location on the map → selects services in their neighborhood → the app generates a personal visualization (an A7 card with a treemap) → it is printed and placed on the physical map.

## 1. Map — MapLibre

- Use `@maplibre/maplibre-react-native` with a **custom Mapbox style JSON** (authored in Mapbox Studio, exported; MapLibre consumes the same style spec).
- Real geographic accuracy: services are pinned at true coordinates.
- Tiles come from a hosted vector source; bundling NL tiles as MBTiles + runtime cache is a Phase 4 nice-to-have, not a launch requirement (venue wifi is expected to work).
- MapLibre is a native module → requires a development build (no Expo Go).

## 2. Printable card — expo-print, HTML/SVG via WebKit, A7

- Generate the PDF on-device with `Print.printToFileAsync({ html, width, height })`; page size is in pixels at 72 PPI (A7 = 74×105 mm ≈ 210×298 pt).
- The treemap artwork is **pure vector SVG**: reuse the pattern/mask defs from the web app's `app/src/components/RatioCard/Treemap/patterns.tsx`, inlined as SVG in the HTML. Never rasterize the artwork.
- Custom fonts: embed Familjen Grotesk as a **base64 `@font-face` (WOFF2)** inside the HTML. Fonts registered via `expo-font` in the app UI do NOT carry over into the print document.
- iOS print HTML does not support local asset URLs — inline everything (fonts, images) as base64. Keep `useMarkupFormatter` off: it drops images/SVG.
- WebKit may rasterize the SVG at print scale — accepted. HTML text remains vector glyphs in the PDF.
- Deferred spike items (resolve before final sign-off): pattern/mask fidelity in WKWebView; custom font actually applied (no silent system fallback); page geometry; zoom-test the printed PDF.

## 3. Printing — direct IPP to the Epson ET-8550

- Use the `ipp` npm package (pure JS) to POST a `Print-Job` with the A7 PDF to the printer's IPP endpoint on the venue network (`http://<printer-ip>:631/...`; confirm the exact queue URI on the device).
- Fully automatic — no print dialog. A confirm-tap is acceptable during development only.
- Media: A7 via `media-col` (`iso_a7_105x74mm`). Vanilla Epson settings; resolve quality/color issues later, not up front.
- iOS prerequisites in `app.json`: `NSLocalNetworkUsageDescription` (local-network prompt) and `NSAllowsLocalNetworking` (ATS exception for plain-HTTP port 631).
- **Build the IPP layer last.** Until it exists, expo-print's manual print path is the development fallback.

## 4. Wizard state — Zustand, in-memory only

- Use a **Zustand** store as the single source of truth for the wizard session: `location`, `selectedServices`, `generatedCard` (including the PDF file path), `printStatus`.
- **No persistence.** Kiosk restarts begin a fresh wizard; do not store session state in sqlite/TypeORM (content data — services, coordinates — still comes from the existing data layer).
- Reset the session when the card is printed, so the kiosk is ready for the next visitor.

## Implementation order

**Phase 0 — Foundations**
- Kiosk skeleton: wizard routes (`index → location → services → generate → print/done`), Familjen Grotesk via `expo-font`, iPad orientation (landscape).
- Styling: plain `StyleSheet` + a tokens module (colors, spacing, type scale, radii); no styling libraries. Single fixed theme matching the physical installation; light/dark only if needed.
- Zustand wizard store (`location`, `selectedServices`, `generatedCard`, `printStatus`) — in-memory only, no persistence.
- Wire the existing sqlite/TypeORM data layer into `ddw-app`; service queries per neighborhood.
- First local dev build on the iPad (`pnpm build:ios`) to establish the build loop early.

**Phase 1 — Screen flow with real data**
- MapLibre map screen: custom style JSON, NL bounds, tap-to-locate (hosted tiles for now).
- Services selection screen, styled with the tokens.
- Treemap screen: port `patterns.tsx` defs to react-native-svg, render from selections.

**Phase 2 — Print pipeline (spike before build)**
- Print spike: expo-print HTML/SVG — pattern/mask fidelity, Familjen Grotesk base64 embedding, A7 geometry, zoom-test, test print on the ET-8550.
- Card generator: A7 HTML from the treemap; layout logic shared with the screen renderer (one source of truth for the artwork).

**Phase 3 — Printing integration + essential kiosk behavior**
- Manual print via expo-print (confirm-tap) as the interim path.
- IPP layer: `ipp` package, `Print-Job` with A7 `media-col`, `NSLocalNetworkUsageDescription` + `NSAllowsLocalNetworking`, automatic submission.
- Printer-offline error state; session reset after print (kiosk loop ready for the next visitor).

**Phase 4 — Nice-to-haves (only if time permits)**
- Offline tiles: MBTiles bundling + runtime tile cache.
- Idle timeout / auto-reset.
- Additional error/UX polish.

**Phase 5 — Launch readiness**
- Dutch copy, final style pass, test cards at real print settings, full-day soak test on the kiosk iPad.

# Development practices

- **Always make a plan, and always ask for a go-ahead before implementing anything.**
- **Use the built-in tools as much as possible instead of the CLI** (file tools, search, and diagnostics over shell commands).
- **Split code into code blocks of at most 4–7 lines.** Every code block starts with a comment explaining what is happening there.
