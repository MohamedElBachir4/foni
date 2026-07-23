"use client";

import { useEffect } from "react";

const RELOAD_AT_KEY = "foni-stale-chunk-reload-at";
const COOLDOWN_MS = 12_000;

/**
 * بعد نشر جديد، أو عند فشل طلب RSC/chunks أثناء التنقّل soft، قد تنهار الصفحة
 * رغم أن المسار موجود. إعادة تحميل قسرية (مع تهدئة) تُصلح التجربة.
 */
export function StaleDeploymentRecovery() {
  useEffect(() => {
    function canReload(): boolean {
      if (typeof sessionStorage === "undefined") return false;
      const last = Number(sessionStorage.getItem(RELOAD_AT_KEY) || 0);
      if (Number.isFinite(last) && Date.now() - last < COOLDOWN_MS) return false;
      return true;
    }

    function tryReload(reason: string) {
      if (!canReload()) return;
      sessionStorage.setItem(RELOAD_AT_KEY, String(Date.now()));
      console.warn("[foni] stale deployment / soft-nav failure, hard reload:", reason);
      window.location.href = window.location.href;
    }

    function shouldRecoverMessage(message: string): boolean {
      const m = message.toLowerCase();
      return (
        m.includes("loading chunk") ||
        m.includes("chunkloaderror") ||
        m.includes("failed to fetch dynamically imported module") ||
        m.includes("failed to find server action") ||
        m.includes("is not defined") ||
        m.includes("application error") ||
        m.includes("unexpected token") ||
        m.includes("hydrat")
      );
    }

    function onError(event: ErrorEvent) {
      const msg = String(event.message || event.error?.message || "");
      if (shouldRecoverMessage(msg)) tryReload(msg);
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      const msg = String(event.reason?.message ?? event.reason ?? "");
      if (shouldRecoverMessage(msg)) tryReload(msg);
    }

    /** طلبات أصول البناء / RSC التي ترجع 404 = نسخة قديمة في المتصفح */
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const res = await originalFetch(...args);
      try {
        const input = args[0];
        const url =
          typeof input === "string"
            ? input
            : input instanceof Request
              ? input.url
              : String(input ?? "");
        if (res.status === 404) {
          const path = url.replace(/^https?:\/\/[^/]+/i, "");
          // فقط أصول البناء المحذوفة بعد النشر — لا نلمس 404 الحقيقي للصفحات
          const isBuildAsset =
            path.startsWith("/_next/static/") || path.startsWith("/_next/data/");
          if (isBuildAsset) {
            tryReload(`fetch-404 ${path.slice(0, 120)}`);
          }
        }
      } catch {
        // لا نكسر الطلب الأصلي
      }
      return res;
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.fetch = originalFetch;
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
