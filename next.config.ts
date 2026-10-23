import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Vercel restores .next/cache between builds, and the restored Turbopack cache served the previous
    // build's globals.css (the Tailwind loader's output) after it changed. Builds are fast without it.
    turbopackFileSystemCacheForBuild: false,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
