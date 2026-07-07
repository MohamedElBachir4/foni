/** صورة افتراضية عند غياب صورة المنتج — foni/public/images/part-defaults/ */
const DEFAULT_PHONE_IMAGE = "/images/part-defaults/photo-non-disponible.jpeg";
const LEGACY_DEFAULT_PHONE_IMAGE = "/photo-non-disponible.jpeg";

/** أحجام العرض — تُطبَّق على روابط Cloudinary لتسريع التحميل */
export type ProductImageSize = "thumb" | "card" | "hero" | "full";

const IMAGE_SIZE_WIDTH: Record<Exclude<ProductImageSize, "full">, number> = {
  thumb: 128,
  card: 384,
  hero: 960,
};

const CLOUDINARY_HOST_RE = /res\.cloudinary\.com/i;

/** صور قطع الغيار الافتراضية من استيراد Excel — foni/public/images/part-defaults/ */
const PART_DEFAULT_IMAGES_PREFIX = "/images/part-defaults/";
const LEGACY_PART_DEFAULT_IMAGES_PREFIX = "/part-defaults/";

function remapPartDefaultImagePath(path: string): string {
  if (path === LEGACY_DEFAULT_PHONE_IMAGE) return DEFAULT_PHONE_IMAGE;
  if (path.startsWith(LEGACY_PART_DEFAULT_IMAGES_PREFIX)) {
    return `${PART_DEFAULT_IMAGES_PREFIX}${path.slice(LEGACY_PART_DEFAULT_IMAGES_PREFIX.length)}`;
  }
  return path;
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

export function isCloudinaryImageUrl(url: string): boolean {
  return CLOUDINARY_HOST_RE.test(String(url || ""));
}

/** يُضيف تحويلات Cloudinary (عرض + ضغط تلقائي) دون إعادة رفع الصورة */
function applyCloudinaryTransform(url: string, width: number): string {
  if (!isCloudinaryImageUrl(url) || !width || width <= 0) return url;
  const marker = "/image/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url;

  const prefix = url.slice(0, idx + marker.length);
  const rest = url.slice(idx + marker.length);
  const transform = `w_${width},c_limit,q_auto:good,f_auto,dpr_auto`;

  if (/^w_\d+/.test(rest)) {
    return `${prefix}${rest.replace(/^w_\d+/, `w_${width}`)}`;
  }
  if (/^v\d+\//.test(rest)) {
    return `${prefix}${transform}/${rest}`;
  }
  if (rest.includes("/") && !/^v\d+\//.test(rest)) {
    return `${prefix}${transform}/${rest}`;
  }
  return `${prefix}${transform}/${rest}`;
}

export type ProductImageUrlOptions = {
  /** thumb=128px, card=384px, hero=960px, full=بدون تحويل */
  size?: ProductImageSize;
  /** عرض مخصص بالبكسل — يُستخدم مع Cloudinary فقط */
  width?: number;
};

function resolveTargetWidth(opts?: ProductImageUrlOptions): number | null {
  if (!opts) return null;
  if (opts.width && opts.width > 0) return Math.round(opts.width);
  if (opts.size && opts.size !== "full") return IMAGE_SIZE_WIDTH[opts.size];
  return null;
}

/**
 * يعيد رابطاً صالحاً لصورة المنتج.
 * - فارغ: الصورة الافتراضية.
 * - بروتوكول نسبي //domain/...: يُحوَّل إلى https (تجنب مشاكل المختلط / Next).
 * - http(s)، data:، blob:، file:، وغيرها من المخططات: كما أُدخلت.
 * - مسار نسبي من جذر الموقع /uploads/...: يُعاد كما هو ليمرّ عبر نفس الأصل (next/image أو rewrites).
 */
export function getProductImageUrl(
  imageUrl: string | undefined | null,
  opts?: ProductImageUrlOptions
): string {
  const raw = (imageUrl ?? "").trim();
  const targetWidth = resolveTargetWidth(opts);

  let resolved = "";
  if (raw.startsWith("//") && !raw.toLowerCase().startsWith("///")) {
    resolved = `https:${raw}`;
  } else if (looksLikeDomainUrl(raw)) {
    resolved = `https://${raw.replace(/^\/+/, "")}`;
  } else if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    /^data:/i.test(raw) ||
    /^blob:/i.test(raw) ||
    /^file:/i.test(raw)
  ) {
    resolved = raw;
  } else if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) || /^[a-z][a-z0-9+.-]+:/i.test(raw)) {
    resolved = raw;
  } else {
    const path = remapPartDefaultImagePath(normalizeImagePath(raw));
    resolved = path || DEFAULT_PHONE_IMAGE;
  }

  if (targetWidth && isCloudinaryImageUrl(resolved)) {
    return applyCloudinaryTransform(resolved, targetWidth);
  }
  return resolved;
}

/** نفس منطق الصور — للفيديو والوسائط الأخرى (بدون صورة افتراضية). */
export function getProductMediaUrl(mediaUrl: string | undefined | null): string {
  const raw = (mediaUrl ?? "").trim();
  if (!raw) return "";
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
  return normalizeImagePath(raw);
}

export { DEFAULT_PHONE_IMAGE };

/** يعيد أول مسار صورة صالح من الحقول المتاحة (image / imageUrl). */
export function resolveProductImageSrc(
  image?: string | null,
  imageUrl?: string | null,
  opts?: ProductImageUrlOptions
): string {
  const raw = (image ?? imageUrl ?? "").trim();
  return raw ? getProductImageUrl(raw, opts) : DEFAULT_PHONE_IMAGE;
}
