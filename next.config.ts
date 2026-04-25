import type { NextConfig } from "next";

const proxyUrl = process.env.API_PROXY_URL;

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    if (!proxyUrl) {
      console.warn("[next.config.ts] API_PROXY_URL is not set. API proxy will not work.");
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: `${proxyUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
