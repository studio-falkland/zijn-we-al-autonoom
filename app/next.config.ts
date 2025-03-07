import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    serverExternalPackages: ['typeorm'],
    // output: 'export',
    experimental: {
        serverMinification: false,
    },
    typescript: {
        ignoreBuildErrors: true
    }
};

export default nextConfig;
