/** @type {import('next').NextConfig} */
const nextConfig = {
    // better-sqlite3 is a native module; keep it out of the webpack bundle so
    // TypeORM's runtime require resolves it from node_modules.
    serverExternalPackages: ['better-sqlite3'],
};

module.exports = nextConfig;
