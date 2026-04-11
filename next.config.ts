import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['whatsapp-web.js', 'puppeteer'],
  outputFileTracingExcludes: {
    '/**/*': [
      'runtime/**/*',
      'desktop-assets/chrome/**/*',
      '.desktop-stage/**/*',
      'out/**/*',
    ],
  },
  experimental: {
  },
  output: 'standalone',
};

export default nextConfig;
