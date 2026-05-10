export type PricedVariant = {
  label: string;
  retailPrice: number;
  wholesalePrice: number;
  repairPrice: number;
  stock?: number;
};

/** تحويل استجابة الـ API إلى مصفوفة صالحة للواجهة. */
export function parsePricedVariantsFromApi(raw: unknown): PricedVariant[] {
  if (!Array.isArray(raw)) return [];
  const out: PricedVariant[] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const label = String(o.label ?? "").trim();
    const retailRaw = Number(o.retailPrice);
    const wholesaleRaw = Number(o.wholesalePrice);
    const repairRaw = Number(o.repairPrice);
    const stockRaw = Number(o.stock);
    if (!label || !(retailRaw > 0)) continue;
    // استجابة الزبائن بعد sanitize تحوي غالباً تجزئة فقط؛ حسابات أخرى قد تعيد حقلين فقط.
    const retailPrice = retailRaw;
    const wholesalePrice =
      Number.isFinite(wholesaleRaw) && wholesaleRaw > 0 ? wholesaleRaw : retailPrice;
    const repairPrice =
      Number.isFinite(repairRaw) && repairRaw > 0 ? repairRaw : retailPrice;
    out.push({
      label,
      retailPrice,
      wholesalePrice,
      repairPrice,
      stock: Number.isFinite(stockRaw) && stockRaw >= 0 ? Math.floor(stockRaw) : 0,
    });
  }
  return out;
}
