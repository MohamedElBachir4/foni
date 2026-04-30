/**
 * عنوان الـ API في المتصفح: بدون شرطة مائلة أخيرة، وبدون ازدواج `/api`.
 * إذا لم يُضبط NEXT_PUBLIC_API_URL يُستخدم المسار النسبي `/api...` (يُعاد توجيهه عبر next.config).
 */
export function getBrowserApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  const trimmed = raw != null ? String(raw).trim() : "";
  if (trimmed && /^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined") {
    return "";
  }
  return "http://localhost:5000";
}

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = getBrowserApiBase();
  if (!base) return p;
  return `${base}${p}`;
}
