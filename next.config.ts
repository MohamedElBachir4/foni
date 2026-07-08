import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    /**
     * لا يدعم Next.js 16 نمط hostname: "**" بشكل موثوق — يؤدي إلى رفض التحسين وطلبات 404 على /_next/image.
     * الصور الديناميكية من الـ API تُعرض عبر <img> حيث يلزم. هنا نطاقات ثابتة للصور المضمّنة في الواجهة.
     */
    remotePatterns: [
      { protocol: "https", hostname: "i.pinimg.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "spiringo.com", pathname: "/**" },
      { protocol: "https", hostname: "www.spiringo.com", pathname: "/**" },
      { protocol: "http", hostname: "localhost", pathname: "/**" },
      { protocol: "https", hostname: "localhost", pathname: "/**" },
      { protocol: "https", hostname: "api.foni-dz.com", pathname: "/**" },
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1440, 1920, 2048],
    imageSizes: [96, 128, 160, 256, 384, 512, 640],
    /** صور منتج عالية الوضوح لا تستخدم قيمًا غير موجودة هنا */
    qualities: [75, 78, 80, 82, 85, 88, 90, 92, 95],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async rewrites() {
    const raw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
    const base = String(raw).replace(/\/+$/, "");
    return [
      {
        source: "/uploads/:path*",
        destination: `${base}/uploads/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${base}/api/:path*`,
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
