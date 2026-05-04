export type PricedVariant = {
  label: string;
  retailPrice: number;
  wholesalePrice: number;
  repairPrice: number;
};

/** تحويل استجابة الـ API إلى مصفوفة صالحة للواجهة. */
export function parsePricedVariantsFromApi(raw: unknown): PricedVariant[] {
  if (!Array.isArray(raw)) return [];
  const out: PricedVariant[] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const label = String(o.label ?? "").trim();
    const retailPrice = Number(o.retailPrice);
    const wholesalePrice = Number(o.wholesalePrice);
    const repairPrice = Number(o.repairPrice);
    if (!label || !(retailPrice > 0) || !(wholesalePrice > 0) || !(repairPrice > 0)) continue;
    out.push({ label, retailPrice, wholesalePrice, repairPrice });
  }
  return out;
}
