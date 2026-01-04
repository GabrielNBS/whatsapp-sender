import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['whatsapp-web.js', 'puppeteer'],
  experimental: {
    // If using Next.js 15+, sometimes needed, but serverExternalPackages at root is standard now.
  }
};

export default nextConfig;
