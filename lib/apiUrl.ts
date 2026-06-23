/**
 * عنوان الـ API في المتصفح: بدون شرطة مائلة أخيرة، وبدون ازدواج `/api`.
 * إذا لم يُضبط NEXT_PUBLIC_API_URL يُستخدم المسار النسبي `/api...` (يُعاد توجيهه عبر next.config).
 */
export function getBrowserApiBase(): string {
  // في المتصفح: نستخدم دائماً نفس الأصل (مسار نسبي /api...) ويتكفّل Next.js rewrites
  // بتمرير الطلب من الخادم إلى الـ API. هذا يتجنّب الطلبات عبر نطاق فرعي مختلف
  // (api.foni-dz.com) التي تتعطّل على بيانات الجوال 4G/5G (مشاكل DNS/مشغّل الشبكة +
  // طلب CORS preflight إضافي عند إرفاق Authorization) فيبقى البحث "جاري التحميل".
  // الطلبات على نفس الأصل لا تحتاج preflight ولا اتصالاً منفصلاً، فهي أكثر استقراراً.
  if (typeof window !== "undefined") {
    return "";
  }
  const raw = process.env.NEXT_PUBLIC_API_URL;
  const trimmed = raw != null ? String(raw).trim() : "";
  if (trimmed && /^https?:\/\//i.test(trimmed)) {
    const cleaned = trimmed.replace(/\/+$/, "");
    try {
      const u = new URL(cleaned);
      // بعض البيئات تُضبط خطأً على www.api.foni-dz.com (غير مستقر على بعض الشبكات).
      // نطبّعه إلى api.foni-dz.com لتفادي أعطال LTE/DNS المتقطعة.
      if (u.hostname === "www.api.foni-dz.com") {
        u.hostname = "api.foni-dz.com";
        return u.toString().replace(/\/+$/, "");
      }
      return cleaned;
    } catch {
      return cleaned;
    }
  }
  return "http://localhost:5001";
}

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = getBrowserApiBase();
  if (!base) return p;
  return `${base}${p}`;
}
