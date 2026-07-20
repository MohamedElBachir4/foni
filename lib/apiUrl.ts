/**
 * عنوان الـ API في المتصفح: بدون شرطة مائلة أخيرة، وبدون ازدواج `/api`.
 * إذا لم يُضبط NEXT_PUBLIC_API_URL يُستخدم المسار النسبي `/api...` (يُعاد توجيهه عبر next.config).
 */
export function getBrowserApiBase(): string {
  // في المتصفح: دائماً نفس الأصل (/api...) — Nginx يوجّه /api مباشرة للباكند.
  // يتجنّب api.foni-dz.com الذي يتعطّل على Djezzy/Ooredoo (DNS مشغّل الشبكة).
  if (typeof window !== "undefined") {
    return "";
  }
  const raw =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL;
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
