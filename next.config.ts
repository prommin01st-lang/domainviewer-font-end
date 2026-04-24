import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://barry-unicolor-unanimatingly.ngrok-free.dev/api/:path*',
      },
    ];
  },
};

export default nextConfig;
