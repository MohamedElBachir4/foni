import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  /**
   * لا تُبقِ حمولة RSC في كاش الموجّه على العميل بعد التنقّل —
   * يقلّل ظهور 404 زائف عند تعارض نسخة قديمة مع نشر جديد.
   */
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
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
    // على السيرفر: INTERNAL_API_URL=http://127.0.0.1:5001 (أسرع وأكثر استقراراً من HTTPS loopback)
    const raw =
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:5001";
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
  /**
   * منع كاش HTML لمدة سنة (s-maxage=31536000) الذي يسبب 404 متقطع بعد النشر:
   * HTML قديم يشير إلى ملفات JS محذوفة. الأصول ذات الـ hash فقط تُخزَّن طويلاً.
   */
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/((?!_next/static|_next/image).*)",
        headers: [
          { key: "Cache-Control", value: "private, no-cache, no-store, max-age=0, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
          { key: "CDN-Cache-Control", value: "no-store" },
          { key: "Surrogate-Control", value: "no-store" },
        ],
      },
    ];
  },
  /** معرّف بناء ثابت نسبياً — يُسهّل تتبع النشر في السجلات */
  generateBuildId: async () => {
    return process.env.BUILD_ID || `foni-${Date.now()}`;
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
