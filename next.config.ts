import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**", pathname: "/**" },
      { protocol: "http", hostname: "**", pathname: "/**" },
      { protocol: "http", hostname: "localhost", pathname: "/**" },
      { protocol: "https", hostname: "localhost", pathname: "/**" }
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [128, 256, 384, 512, 640],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async rewrites() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    return [
      {
        source: "/uploads/:path*",
        destination: `${API_URL}/uploads/:path*`, // Proxy to Backend
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
