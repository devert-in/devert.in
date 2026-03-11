import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  output: 'export',
  images: {
    unoptimized: true,
  },
  experimental: {
    // @ts-ignore
    turbopack: {
      root: process.cwd(),
    }
  },

};

export default nextConfig;
