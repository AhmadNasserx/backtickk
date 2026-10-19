import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Enables forbidden(): renders app/forbidden.tsx and returns HTTP 403.
  experimental: {
    authInterrupts: true,
  },
  images: {
    // OAuth avatar hosts. Anything else must be rendered with unoptimized (see components/ui/avatar.tsx).
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
