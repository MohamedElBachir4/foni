import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logServerError } from "@/lib/serverLog";

/**
 * يستقبل تقارير error.tsx / global-error.tsx من المتصفح ويكتبها في سجل الخادم.
 * لا علاقة له بـ /api/:path* (لا يُوجَّه لباكند Express) — تسجيل داخلي في عملية Next.js فقط.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      message?: string;
      digest?: string;
      stack?: string;
      pathname?: string;
      name?: string;
    };
    logServerError(new Error(body.message || "client-reported error"), {
      route: "client:error-boundary",
      pathname: body.pathname,
      digest: body.digest,
      extra: { stack: body.stack, name: body.name, source: "browser" },
    });
  } catch {
    // لا نُفشل استجابة العميل بسبب خطأ في التسجيل نفسه
  }
  return NextResponse.json({ ok: true });
}
