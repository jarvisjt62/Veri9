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
  // ─────────────────────────────────────────────────────────────────
  // Round 29d — Auto-update / cache freshness rules.
  //
  // The goal: when we deploy a new build, every user picks it up
  // automatically without needing to clear their browser cache.
  //
  // Strategy:
  //   • HTML pages          → no-cache, must-revalidate (always check)
  //   • /version.json       → no-store (the heartbeat — must never cache)
  //   • /api/*              → no-store (server already controls)
  //   • _next/static/*      → immutable (already content-hashed by Next)
  //   • _next/image          → 7-day s-maxage (image transformations)
  // ─────────────────────────────────────────────────────────────────
  async headers() {
    return [
      // Always-fresh heartbeat file consumed by <UpdateChecker />
      {
        source: "/version.json",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
      // API responses — never cached (engine, verify, admin/config etc.)
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
      // Manifest / service-worker style files must always be fresh
      {
        source: "/manifest.json",
        headers: [{ key: "Cache-Control", value: "no-cache, must-revalidate, max-age=0" }],
      },
      // Static assets bundled by Next get fingerprinted hashes — safe to
      // cache forever. (Already the default, but we make it explicit so
      // any CDN in front respects it.)
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // All HTML / page documents — must revalidate every navigation.
      // This is the magic that makes auto-update work without a hard refresh:
      // browsers will always re-check the document, see new asset hashes,
      // and pull in fresh JS/CSS.
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, must-revalidate, max-age=0",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
