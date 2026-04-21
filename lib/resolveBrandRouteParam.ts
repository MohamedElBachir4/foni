import { SPARE_PARTS_STATIC_BRAND_BY_SLUG } from "./sparePartsStaticBrands";

export type ApiBrandLite = { _id: string; name: string; slug?: string };

function slugifyName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

/** هل المعلمة معرّف MongoDB صالح؟ */
export function isMongoObjectId(param: string) {
  return /^[a-f0-9]{24}$/i.test(param);
}

/**
 * يحوّل معرّف الماركة في المسار (ObjectId أو slug مثل apple) إلى معرّف قاعدة البيانات واسم العرض.
 */
export function resolveBrandRouteParam(
  param: string,
  apiBrands: ApiBrandLite[]
): { mongoId: string | null; displayName: string } {
  if (!param) {
    return { mongoId: null, displayName: "ماركة" };
  }

  if (isMongoObjectId(param)) {
    const found = apiBrands.find((b) => b._id === param);
    return {
      mongoId: param,
      displayName: found?.name ?? "ماركة",
    };
  }

  const slug = param.toLowerCase();
  const found =
    apiBrands.find(
      (b) =>
        (b.slug && b.slug.toLowerCase() === slug) ||
        slugifyName(b.name) === slug ||
        b.name.trim().toLowerCase() === slug
    ) || null;

  if (found) {
    return { mongoId: found._id, displayName: found.name };
  }

  const meta = SPARE_PARTS_STATIC_BRAND_BY_SLUG[slug];
  return {
    mongoId: null,
    displayName: meta?.name ?? param,
  };
}
