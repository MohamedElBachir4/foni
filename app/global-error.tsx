"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * يلتقط أخطاء RootLayout نفسه (app/error.tsx لا يغطّيها لأنه متداخل داخل الـ layout).
 * يجب أن يحتوي <html>/<body> الخاصين به لأنه يستبدل الجذر بالكامل عند التفعيل.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[foni] root layout error:", error);
    fetch("/internal/client-error-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        message: error.message,
        digest: error.digest,
        stack: error.stack,
        name: error.name,
        pathname: typeof window !== "undefined" ? window.location.pathname : undefined,
      }),
    }).catch(() => {
      // تجاهل فشل التسجيل نفسه
    });
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="font-sans antialiased text-slate-900">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">تعذّر تحميل الموقع</h1>
          <p className="max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
            حدث خطأ غير متوقع. حاول مرة أخرى بعد لحظات.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              إعادة المحاولة
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.reload();
              }}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              تحديث الصفحة
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
