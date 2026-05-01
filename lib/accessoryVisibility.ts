/**
 * أكسسوار مربوط بموديل (PhoneType) — يُعرض فقط في
 * `/brand/{slug}/accessories?phoneType={id}` وليس في قوائم الأنواع العامة.
 * يدعم `phoneTypes` (مصفوفة) والحقل القديم `phoneType` الواحد.
 */
function accessoryPhoneIdFromRef(entry: unknown): string | null {
  if (entry == null) return null;
  if (typeof entry === "object" && "_id" in entry) {
    const id = (entry as { _id?: unknown })._id;
    if (typeof id === "string" && /^[a-f0-9]{24}$/i.test(id)) return id;
  }
  if (typeof entry === "string" && /^[a-f0-9]{24}$/i.test(entry)) return entry;
  return null;
}

export function getPhoneTypeIdsFromAccessory(a: {
  phoneTypes?: unknown;
  phoneType?: unknown;
}): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string | null) => {
    if (!raw || !/^[a-f0-9]{24}$/i.test(raw)) return;
    const n = raw.toLowerCase();
    if (seen.has(n)) return;
    seen.add(n);
    out.push(raw);
  };
  if (Array.isArray(a.phoneTypes)) {
    for (const pt of a.phoneTypes) push(accessoryPhoneIdFromRef(pt));
  }
  push(accessoryPhoneIdFromRef(a.phoneType));
  return out;
}

/** أول معرّف موديل (للتوافق مع الحقول القديمة) */
export function getPhoneTypeIdString(a: { phoneTypes?: unknown; phoneType?: unknown }): string {
  const ids = getPhoneTypeIdsFromAccessory(a);
  return ids[0] ?? "";
}

export function accessoryIsModelSpecific(a: {
  phoneTypes?: unknown;
  phoneType?: unknown;
}): boolean {
  return getPhoneTypeIdsFromAccessory(a).length > 0;
}

export function accessoryMatchesPhoneModel(
  a: { phoneTypes?: unknown; phoneType?: unknown },
  phoneTypeId: string | null | undefined
): boolean {
  if (!phoneTypeId || !/^[a-f0-9]{24}$/i.test(phoneTypeId)) return false;
  const n = phoneTypeId.toLowerCase();
  return getPhoneTypeIdsFromAccessory(a).some((id) => id.toLowerCase() === n);
}

export function filterAccessoriesForTypeListing<
  T extends { phoneTypes?: unknown; phoneType?: unknown },
>(list: T[]): T[] {
  return list.filter((a) => !accessoryIsModelSpecific(a));
}

export function filterAccessoriesForBrandPage<
  T extends { phoneTypes?: unknown; phoneType?: unknown },
>(list: T[], phoneTypeId: string | null): T[] {
  if (phoneTypeId && /^[a-f0-9]{24}$/i.test(phoneTypeId)) {
    return list.filter((a) => accessoryMatchesPhoneModel(a, phoneTypeId));
  }
  return list.filter((a) => !accessoryIsModelSpecific(a));
}
