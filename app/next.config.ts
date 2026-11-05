import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: ['typeorm'],
    output: 'export',
    staticPageGenerationTimeout: 300,
    experimental: {
        serverMinification: false,
        staticGenerationMaxConcurrency: 4,
    },
    typescript: {
        ignoreBuildErrors: true
    },
    trailingSlash: true,
};

export default nextConfig;
