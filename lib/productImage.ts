/**
 * صورة افتراضية عند غياب صورة المنتج (data URL لتجنب 403 من المواقع الخارجية).
 */
const DEFAULT_PHONE_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23f1f5f9' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='18'%3Eلا توجد صورة%3C/text%3E%3C/svg%3E";

function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
}

/**
 * يعيد رابطاً صالحاً لصورة المنتج.
 * - إذا كان الرابط فارغاً أو غير صالح: يعيد الصورة الافتراضية.
 * - إذا كان يبدأ بـ /: يضيف له عنوان خادم الـ API.
 * - إذا كان رابطاً كاملاً (http/https): يُعاد كما هو.
 */
export function getProductImageUrl(imageUrl: string | undefined | null): string {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const raw = (imageUrl ?? "").trim();
  if (!raw) return DEFAULT_PHONE_IMAGE;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("/")) return `${base}${raw}`;
  return DEFAULT_PHONE_IMAGE;
}

export { DEFAULT_PHONE_IMAGE };
