"use client";

import { useEffect } from "react";

const PREFIX = "foni-nf-hard-";

/**
 * أول مرة يظهر فيها 404 لمسار معيّن في الجلسة: نعيد تحميلاً قسرياً مرة واحدة.
 * إن كان 404 زائفاً (كاش/نشر) تُصلح الصفحة؛ وإن كان حقيقياً تظهر الرسالة بعد التحميل.
 */
export function NotFoundRecovery() {
  useEffect(() => {
    try {
      const path = window.location.pathname + window.location.search;
      const key = PREFIX + path;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
      // تأخير قصير حتى لا نتعارض مع رسم الصفحة
      const t = window.setTimeout(() => {
        window.location.replace(window.location.href);
      }, 120);
      return () => window.clearTimeout(t);
    } catch {
      // ignore
    }
  }, []);

  return null;
}
