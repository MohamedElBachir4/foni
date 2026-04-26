/**
 * أكسسوار مربوط بموديل (PhoneType) — يُعرض فقط في
 * `/brand/{slug}/accessories?phoneType={id}` وليس في قوائم الأنواع العامة.
 */
export function getPhoneTypeIdString(a: { phoneType?: unknown }): string {
  const p = a.phoneType;
  if (p == null) return "";
  if (typeof p === "object" && p !== null && "_id" in p) {
    return String((p as { _id: string })._id);
  }
  if (typeof p === "string" && /^[a-f0-9]{24}$/i.test(p)) {
    return p;
  }
  return "";
}

export function accessoryIsModelSpecific(a: { phoneType?: unknown }): boolean {
  return getPhoneTypeIdString(a) !== "";
}

export function filterAccessoriesForTypeListing<T extends { phoneType?: unknown }>(
  list: T[]
): T[] {
  return list.filter((a) => !accessoryIsModelSpecific(a));
}

export function filterAccessoriesForBrandPage<T extends { phoneType?: unknown }>(
  list: T[],
  phoneTypeId: string | null
): T[] {
  if (phoneTypeId) {
    const n = String(phoneTypeId).toLowerCase();
    return list.filter(
      (a) => getPhoneTypeIdString(a).toLowerCase() === n
    );
  }
  return list.filter((a) => !accessoryIsModelSpecific(a));
}
