"use client";

import { useEffect } from "react";

const RELOAD_KEY = "foni-stale-chunk-reload";

/**
 * بعد نشر جديد، قد يحمل المتصفح HTML/JS من نشرين مختلفين → 404 أو ReferenceError.
 * إعادة تحميل واحدة تلقائياً (مرة لكل جلسة) تُصلح التجربة دون أن يرى الزائر خطأً.
 */
export function StaleDeploymentRecovery() {
  useEffect(() => {
    function shouldRecover(message: string): boolean {
      const m = message.toLowerCase();
      return (
        m.includes("loading chunk") ||
        m.includes("failed to fetch dynamically imported module") ||
        m.includes("failed to find server action") ||
        m.includes("is not defined") ||
        m.includes("application error")
      );
    }

    function tryReload(reason: string) {
      if (typeof sessionStorage === "undefined") return;
      if (sessionStorage.getItem(RELOAD_KEY)) return;
      sessionStorage.setItem(RELOAD_KEY, "1");
      console.warn("[foni] stale deployment detected, reloading once:", reason);
      window.location.reload();
    }

    function onError(event: ErrorEvent) {
      const msg = String(event.message || event.error?.message || "");
      if (shouldRecover(msg)) tryReload(msg);
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      const msg = String(event.reason?.message ?? event.reason ?? "");
      if (shouldRecover(msg)) tryReload(msg);
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
