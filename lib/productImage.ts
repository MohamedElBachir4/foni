/** صورة افتراضية عند غياب صورة المنتج — PHOTO NON DISPONIBLE (foni/public). */
const DEFAULT_PHONE_IMAGE = "/photo-non-disponible.jpeg";

function hasExplicitPublicApiUrl(): boolean {
  const t = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();
  return /^https?:\/\//i.test(t);
}

/** يحوّل المسار المخزّن (مثل uploads/... أو /uploads/...) إلى مسار نسبي من جذر الموقع. */
function normalizeImagePath(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (t.startsWith("/")) return t;
  return `/${t.replace(/^\/+/, "")}`;
}

/**
 * Accept common user-entered image links even when protocol is omitted.
 * Examples:
 * - example.com/a.jpg -> https://example.com/a.jpg
 * - www.example.com/a.png -> https://www.example.com/a.png
 */
function looksLikeDomainUrl(raw: string): boolean {
  const s = raw.trim();
  if (!s || /\s/.test(s)) return false;
  if (s.startsWith("/") || s.startsWith("./") || s.startsWith("../")) return false;
  // Basic domain.tld[/...]
  return /^[a-z0-9.-]+\.[a-z]{2,}(?:[/:?#].*)?$/i.test(s);
}

/**
 * يعيد رابطاً صالحاً لصورة المنتج.
 * - فارغ: الصورة الافتراضية.
 * - بروتوكول نسبي //domain/...: يُحوَّل إلى https (تجنب مشاكل المختلط / Next).
 * - http(s)، data:، blob:، file:، وغيرها من المخططات: كما أُدخلت.
 * - مسار نسبي من جذر الموقع /uploads/...: عبر rewrites أو عبر NEXT_PUBLIC_API_URL.
 */
export function getProductImageUrl(imageUrl: string | undefined | null): string {
  const raw = (imageUrl ?? "").trim();
  if (!raw) return DEFAULT_PHONE_IMAGE;
  if (raw.startsWith("//") && !raw.toLowerCase().startsWith("///")) {
    return `https:${raw}`;
  }
  if (looksLikeDomainUrl(raw)) {
    return `https://${raw.replace(/^\/+/, "")}`;
  }
  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    /^data:/i.test(raw) ||
    /^blob:/i.test(raw) ||
    /^file:/i.test(raw)
  ) {
    return raw;
  }
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) || /^[a-z][a-z0-9+.-]+:/i.test(raw)) {
    return raw;
  }

  const path = normalizeImagePath(raw);
  if (!path) return DEFAULT_PHONE_IMAGE;

  if (hasExplicitPublicApiUrl()) {
    const base = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/$/, "");
    return `${base}${path}`;
  }
  return path;
}

export { DEFAULT_PHONE_IMAGE };
