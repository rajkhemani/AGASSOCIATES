import type { NextConfig } from "next";

/**
 * Static export — the site is served from GitHub Pages at advadiityagade.com,
 * which has no Node runtime. `images.unoptimized` is required because the
 * default image optimiser needs a server.
 */
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
