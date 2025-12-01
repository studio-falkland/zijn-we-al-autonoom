import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: ['typeorm'],
    output: 'export',
    experimental: {
        serverMinification: false,
    },
    typescript: {
        ignoreBuildErrors: true
    },
    trailingSlash: true,
};

export default nextConfig;
