import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['whatsapp-web.js', 'puppeteer'],
  experimental: {
  },
  output: 'standalone',
};

export default nextConfig;
