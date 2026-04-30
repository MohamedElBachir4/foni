/**
 * ترتيب عرض موديلات iPhone: من الأحدث جيلاً للأقدم، وداخل الجيل: Pro Max → Pro → Air → عادي → Plus → e / mini…
 * قابل للتوسعة (iPhone 17، 18…).
 */

export function isAppleBrand(brandParam: string, brandName?: string | null): boolean {
  const p = (brandParam || "").toLowerCase();
  if (p === "apple" || p === "iphone") return true;
  const n = (brandName || "").toLowerCase();
  return n === "apple" || n.includes("apple");
}

/** مفتاح الجيل: 16 → 16. SE → 0. X/XS/XR → 10. غير واضح → -1. */
export function parseIPhoneGenerationKey(name: string): number | null {
  const s = name.trim();
  const m = s.match(/iPhone\s*(\d{1,2})\b/i);
  if (m) return parseInt(m[1], 10);
  if (/iPhone\s*SE\b/i.test(s)) return 0;
  if (/iPhone\s*X[SR]?\b/i.test(s) || /iPhone\s*XR\b/i.test(s) || /iPhone\s*XS\b/i.test(s) || /iPhone\s*X\b/i.test(s)) {
    return 10;
  }
  return null;
}

/**
 * داخل نفس السلسلة: أصغر = يظهر أبكر
 * 0: Pro Max — 10: Pro — 12: Air — 20: عادي — 30: Plus — 32: e — 35: mini — 40: SE
 */
export function getIPhoneVariantRank(name: string): number {
  const s = name.toLowerCase();
  if (/\bpro\s*max\b/.test(s) || /\bpromax\b/.test(s)) return 0;
  if (/\bpro\b/.test(s) && !/\bpro\s*max\b/.test(s) && !/\bpromax\b/.test(s)) return 10;
  if (/\bair\b/.test(s) && /iphone/.test(s)) return 12;
  if (/\bplus\b/.test(s)) return 30;
  if (/\b1[1-9]e\b|\b2[0-8]e\b|iphone\s*\d{1,2}e/.test(s.replace(/\s/g, " "))) return 32;
  if (/\bmini\b/.test(s)) return 35;
  if (/\biphone\s*se\b/i.test(s)) return 40;
  return 20;
}

function compareIphonePhoneTypes<T extends { name: string }>(a: T, b: T): number {
  const ga = parseIPhoneGenerationKey(a.name);
  const gb = parseIPhoneGenerationKey(b.name);
  const aUnk = ga === null;
  const bUnk = gb === null;
  if (aUnk && bUnk) return a.name.localeCompare(b.name, "en", { numeric: true, sensitivity: "base" });
  if (aUnk) return 1;
  if (bUnk) return -1;
  if (ga !== gb) {
    if (ga === 0) return 1; /* SE بعد باقي الأجيال الرقمية */
    if (gb === 0) return -1;
    if (ga === 10) {
      if (gb !== 10) return 1; /* X بعد الأجيال الحديثة 11+ */
    }
    if (gb === 10) {
      if (ga !== 10) return -1;
    }
    return (gb as number) - (ga as number); /* جيل أحدث (رقم أكبر) أولاً */
  }
  const vr = getIPhoneVariantRank(a.name) - getIPhoneVariantRank(b.name);
  if (vr !== 0) return vr;
  return a.name.localeCompare(b.name, "en", { numeric: true, sensitivity: "base" });
}

export function sortPhoneTypesForAppleIphone<T extends { name: string }>(items: T[]): T[] {
  if (items.length === 0) return [];
  return [...items].sort(compareIphonePhoneTypes);
}
