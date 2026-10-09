// Metro bundles .db files as assets (expo-sqlite file support); declare the module for TS.
declare module '*.db';

// Asset imports resolve to an asset id (a number) that expo-image's `source` accepts.
declare module '*.png' {
    const asset: number;
    export default asset;
}
declare module '*.svg' {
    const asset: number;
    export default asset;
}
