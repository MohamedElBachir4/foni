/**
 * ماركات قطع الغيار المعروضة في الواجهة.
 * القائمة موحّدة مع `foni/lib/brandCatalog.json` و `npm run sync-brands` في الخادم.
 */
import catalog from "./brandCatalog.json";

export type StaticSparePartBrand = { slug: string; name: string };

export const SPARE_PARTS_STATIC_BRANDS: StaticSparePartBrand[] = catalog.brands;

export const SPARE_PARTS_STATIC_BRAND_BY_SLUG: Record<string, { name: string }> =
  Object.fromEntries(catalog.brands.map((b) => [b.slug, { name: b.name }]));
