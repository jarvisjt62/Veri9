import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  // Allow CommonJS modules in API routes
  serverExternalPackages: [],
  // Environment variables available to server
  env: {
    NEXT_PUBLIC_APP_NAME: "Veri9",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "https://veri9.com",
  },
};

export default nextConfig;