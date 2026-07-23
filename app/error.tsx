"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[foni] route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">تعذّر تحميل الصفحة</h1>
      <p className="max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
        حدث خطأ مؤقت في الاتصال أو الخادم. هذا ليس بالضرورة أن الصفحة غير موجودة —
        حاول مرة أخرى.
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
  );
}
