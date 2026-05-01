import type { CSSProperties } from "react";

/** تعريف لون منتج (معرّف ثابت للتخزين في DB و API) */
export type ProductColorDef = {
  id: string;
  labelAr: string;
  hex: string;
};

/**
 * قائمة الألوان المعتمدة في النظام (لوحة التحكم + الموقع + السلة).
 * المعرّفات بالإنجليزية صغيرة و snake_case حيث يلزم.
 */
export const PRODUCT_COLORS: ProductColorDef[] = [
  { id: "black", labelAr: "أسود", hex: "#1a1a1a" },
  { id: "white", labelAr: "أبيض", hex: "#f5f5f5" },
  { id: "gray", labelAr: "رمادي / سبيس غراي", hex: "#8e8e93" },
  { id: "silver", labelAr: "فضي", hex: "#c5c5c7" },
  { id: "gold", labelAr: "ذهبي", hex: "#d4af37" },
  { id: "rose_gold", labelAr: "ذهبي وردي", hex: "#e8b4b8" },
  { id: "blue", labelAr: "أزرق", hex: "#2563eb" },
  { id: "navy_blue", labelAr: "أزرق داكن", hex: "#1e3a5f" },
  { id: "green", labelAr: "أخضر", hex: "#22c55e" },
  { id: "dark_green", labelAr: "أخضر داكن", hex: "#14532d" },
  { id: "purple", labelAr: "بنفسجي", hex: "#7c3aed" },
  { id: "red", labelAr: "أحمر", hex: "#dc2626" },
  { id: "orange", labelAr: "برتقالي", hex: "#ea580c" },
  { id: "yellow", labelAr: "أصفر", hex: "#eab308" },
  { id: "pink", labelAr: "وردي", hex: "#ec4899" },
  { id: "sky_blue", labelAr: "سماوي", hex: "#38bdf8" },
  { id: "turquoise", labelAr: "تركوازي", hex: "#2dd4bf" },
  { id: "bronze", labelAr: "برونزي", hex: "#8b5a2b" },
  { id: "copper", labelAr: "نحاسي", hex: "#b87333" },
  { id: "beige", labelAr: "بيج", hex: "#d4c4a8" },
  { id: "cream", labelAr: "كريمي", hex: "#fffdd0" },
  { id: "transparent", labelAr: "شفاف", hex: "#e2e8f0" },
  { id: "multicolor", labelAr: "متعدد الألوان", hex: "#94a3b8" },
];

/** ألوان قديمة ما زالت ممكن أن توجد في قاعدة البيانات */
const LEGACY_COLORS: ProductColorDef[] = [{ id: "brown", labelAr: "بني", hex: "#92400e" }];

const ALL_DEFS: ProductColorDef[] = [...PRODUCT_COLORS, ...LEGACY_COLORS];

const ID_SET = new Set(ALL_DEFS.map((c) => c.id));

const HEX_BY_ID = ALL_DEFS.reduce<Record<string, string>>((acc, c) => {
  acc[c.id] = c.hex;
  return acc;
}, {});

const LABEL_BY_ID = ALL_DEFS.reduce<Record<string, string>>((acc, c) => {
  acc[c.id] = c.labelAr;
  return acc;
}, {});

export function isValidProductColorId(id: string): boolean {
  return ID_SET.has(String(id || "").trim().toLowerCase());
}

/** يُرجع معرفات صالحة بدون تكرار بالترتيب الأصلي للقائمة */
export function filterValidProductColorIds(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of input) {
    const id = String(x ?? "")
      .trim()
      .toLowerCase();
    if (!ID_SET.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function getProductColorHex(colorId: string): string {
  const id = String(colorId || "")
    .trim()
    .toLowerCase();
  return HEX_BY_ID[id] || "#94a3b8";
}

export function getProductColorLabelAr(colorId: string): string {
  const id = String(colorId || "")
    .trim()
    .toLowerCase();
  return LABEL_BY_ID[id] || colorId;
}

/** خريطة hex لاستخدامها في مكوّنات بسيطة */
export function getProductColorHexMap(): Record<string, string> {
  return { ...HEX_BY_ID };
}

/** أنماط دوائر الألوان (شفاف / متعدد / عادي) */
export function getProductColorCircleStyle(colorId: string): CSSProperties {
  const id = String(colorId || "")
    .trim()
    .toLowerCase();
  if (id === "multicolor") {
    return {
      background:
        "conic-gradient(from 200deg, #ef4444 0deg, #eab308 72deg, #22c55e 144deg, #2563eb 216deg, #a855f7 288deg, #ef4444 360deg)",
    };
  }
  if (id === "transparent") {
    return {
      backgroundColor: "#fff",
      backgroundImage:
        "linear-gradient(45deg,#cbd5e1 25%,transparent 25%),linear-gradient(-45deg,#cbd5e1 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#cbd5e1 75%),linear-gradient(-45deg,transparent 75%,#cbd5e1 75%)",
      backgroundSize: "10px 10px",
      backgroundPosition: "0 0,0 5px,5px -5px,-5px 0px",
    };
  }
  return { backgroundColor: getProductColorHex(id) };
}

/** للوحات الإدارة: { id, label, hex } */
export function productColorOptionsForAdmin(): { id: string; label: string; hex: string }[] {
  return PRODUCT_COLORS.map((c) => ({ id: c.id, label: c.labelAr, hex: c.hex }));
}
