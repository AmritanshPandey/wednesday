import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js externalizes firebase-admin by default (baked into
  // next/dist/lib/server-external-packages.jsonc, independent of anything
  // here), which forces it to load via Node's native require() at runtime.
  // Its jwks-rsa -> jose chain is pure ESM in jose 6.x (no CJS export), which
  // crashes under native require(). transpilePackages explicitly opts it
  // out of that default externalization so Turbopack bundles it instead,
  // where ESM/CJS interop is handled correctly at build time.
  transpilePackages: ["firebase-admin"],
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
