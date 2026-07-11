import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin (and @google-cloud/firestore) must run as a real Node
  // module, not be bundled by Turbopack/webpack.
  serverExternalPackages: ["firebase-admin", "@google-cloud/firestore"],
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
