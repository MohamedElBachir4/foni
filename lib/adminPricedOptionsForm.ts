/** خيار منتج في النموذج والـ API (تجزئة / جملة / مصلحين). */
export type PricedOptionCompare = {
  label: string;
  retailPrice: number;
  wholesalePrice: number;
  repairPrice: number;
};

export type PricedOptionFormRow = {
  id: string;
  label: string;
  retailPrice: string;
  wholesalePrice: string;
  repairPrice: string;
};

export function createEmptyPricedOptionRow(): PricedOptionFormRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    label: "",
    retailPrice: "",
    wholesalePrice: "",
    repairPrice: "",
  };
}

export function pricedRowsFromApi(
  pricedOptions: PricedOptionCompare[] | undefined
): PricedOptionFormRow[] {
  if (!Array.isArray(pricedOptions) || pricedOptions.length === 0) return [];
  return pricedOptions.map((o) => ({
    id: `${String(o.label ?? "")}-${Math.random().toString(36).slice(2, 7)}`,
    label: String(o.label ?? ""),
    retailPrice: o.retailPrice != null ? String(o.retailPrice) : "",
    wholesalePrice: o.wholesalePrice != null ? String(o.wholesalePrice) : "",
    repairPrice: o.repairPrice != null ? String(o.repairPrice) : "",
  }));
}

export function validatePricedOptionRows(
  rows: PricedOptionFormRow[]
): { ok: true; data: PricedOptionCompare[] } | { ok: false; text: string } {
  const candidates = rows
    .map((r) => ({
      label: r.label.trim(),
      retailPrice: r.retailPrice.trim(),
      wholesalePrice: r.wholesalePrice.trim(),
      repairPrice: r.repairPrice.trim(),
    }))
    .filter((r) => r.label || r.retailPrice || r.wholesalePrice || r.repairPrice);

  if (candidates.length === 0) {
    return { ok: true, data: [] };
  }

  const data: PricedOptionCompare[] = [];
  for (const r of candidates) {
    if (!r.label) {
      return { ok: false, text: "كل خيار يجب أن يكون له اسم (مثلاً 64GB)." };
    }
    const retailPrice = Number(r.retailPrice);
    const wholesalePrice = Number(r.wholesalePrice);
    const repairPrice = Number(r.repairPrice);
    if (!(retailPrice > 0) || !(wholesalePrice > 0) || !(repairPrice > 0)) {
      return {
        ok: false,
        text: `الخيار «${r.label}»: أدخل سعر التجزئة والجملة والمصلحين (كلها أكبر من صفر).`,
      };
    }
    data.push({ label: r.label, retailPrice, wholesalePrice, repairPrice });
  }
  return { ok: true, data };
}
