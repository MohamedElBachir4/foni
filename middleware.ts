import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** رؤوس تمنع تخزين HTML/RSC في CDN أو المتصفح — تُجنّب 404 بعد كل نشر */
const NO_STORE_HEADERS: [string, string][] = [
  ["Cache-Control", "private, no-cache, no-store, max-age=0, must-revalidate"],
  ["Pragma", "no-cache"],
  ["Expires", "0"],
  ["CDN-Cache-Control", "no-store"],
  ["Surrogate-Control", "no-store"],
];

function applyNoStore(response: NextResponse) {
  for (const [key, value] of NO_STORE_HEADERS) {
    response.headers.set(key, value);
  }
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // أصول Next الثابتة (hash في اسم الملف) — كاش طويل آمن
  if (pathname.startsWith("/_next/static/")) {
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "public, max-age=31536000, immutable");
    return res;
  }

  // بيانات RSC / prefetch — لا تُخزَّن (مصدر شائع لـ 404 بعد النشر)
  if (pathname.startsWith("/_next/data/") || pathname.startsWith("/_next/image")) {
    return applyNoStore(NextResponse.next());
  }

  // لوحة التحكم + صفحات HTML — دائماً fresh
  if (pathname.startsWith("/admin") || !pathname.includes(".")) {
    return applyNoStore(NextResponse.next());
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|txt|xml|json)$).*)",
  ],
};
