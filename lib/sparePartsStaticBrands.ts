/**
 * ماركات قطع الغيار المعروضة في الواجهة — بيانات ثابتة (لا تعتمد على /api/brands لعرض الشبكة).
 * روابط الصفحات تستخدم slug؛ عند جلب الموديلات يُحلّ الـ slug إلى ObjectId إن وُجدت الماركة في الـ API.
 */
export type StaticSparePartBrand = { slug: string; name: string };

export const SPARE_PARTS_STATIC_BRANDS: StaticSparePartBrand[] = [
  { slug: "apple", name: "Apple" },
  { slug: "samsung", name: "Samsung" },
  { slug: "xiaomi", name: "Xiaomi" },
  { slug: "oppo", name: "Oppo" },
  { slug: "huawei", name: "Huawei" },
  { slug: "infinix", name: "Infinix" },
  { slug: "google", name: "Google" },
  { slug: "realme", name: "Realme" },
  { slug: "oneplus", name: "OnePlus" },
  { slug: "redmi", name: "Redmi" },
  { slug: "motorola", name: "Motorola" },
  { slug: "vivo", name: "Vivo" },
  { slug: "ace", name: "Ace" },
  { slug: "tecno", name: "Tecno" },
  { slug: "nokia", name: "Nokia" },
  { slug: "lg", name: "LG" },
  { slug: "condor", name: "Condor" },
  { slug: "itel", name: "Itel" },
  { slug: "honor", name: "Honor" },
  { slug: "poco", name: "Poco" },
];

export const SPARE_PARTS_STATIC_BRAND_BY_SLUG: Record<string, { name: string }> =
  Object.fromEntries(SPARE_PARTS_STATIC_BRANDS.map((b) => [b.slug, { name: b.name }]));
