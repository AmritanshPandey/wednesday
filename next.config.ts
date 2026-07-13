import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundling firebase-admin (rather than externalizing it) lets Turbopack
  // resolve its jwks-rsa -> jose dependency correctly. jose 6.x ships as
  // pure ESM with no CommonJS export, which breaks under Node's native
  // require() when the package is left external — Turbopack's bundler
  // handles that ESM/CJS interop at build time instead.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Google account avatars
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Cloudflare R2 default public buckets (pub-xxxx.r2.dev). Add your own
      // custom photo domain here too if you attach one.
      { protocol: "https", hostname: "*.r2.dev" }
    ]
  }
};

export default nextConfig;
