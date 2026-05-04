/**
 * نسخ المنتج من لوحة التحكم: لقطة لمقارنة حمولة الإنشاء قبل الحفظ.
 */

export const ADMIN_COPY_UNCHANGED_MESSAGE =
  "لا يمكن إنشاء المنتج لأن جميع المعلومات مطابقة لمنتج موجود بالفعل. يرجى تعديل حقل واحد على الأقل قبل الحفظ.";

export function parseExtraImagesLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);
}

/** تسلسل ثابت لمفاتيح المستوى الأعلى فقط (الحمولات مسطّحة تقريباً). */
export function snapshotCreatePayload(payload: Record<string, unknown>): string {
  const keys = Object.keys(payload).sort();
  const sorted: Record<string, unknown> = {};
  for (const k of keys) {
    sorted[k] = payload[k];
  }
  return JSON.stringify(sorted);
}

export function buildPhoneCreateComparePayload(args: {
  phoneName: string;
  selectedBrand: string;
  image: string;
  extraImagesText: string;
  price: string;
  priceRetail: string;
  priceWholesale: string;
  priceReparateur: string;
  details: string;
  selectedColors: string[];
  options: string[];
}): Record<string, unknown> {
  return {
    name: args.phoneName.trim(),
    brand: args.selectedBrand,
    image: args.image.trim(),
    extraImages: parseExtraImagesLines(args.extraImagesText),
    price: args.price.trim() ? Number(args.price) : 0,
    priceRetail: args.priceRetail.trim() ? Number(args.priceRetail) : undefined,
    priceWholesale: args.priceWholesale.trim() ? Number(args.priceWholesale) : undefined,
    priceReparateur: args.priceReparateur.trim() ? Number(args.priceReparateur) : undefined,
    details: args.details.trim(),
    colors: [...args.selectedColors],
    options: args.options.map((x) => String(x || "").trim()).filter(Boolean),
  };
}

export function snapshotFromPhoneForCopy(phone: {
  name: string;
  brand: { _id?: string } | string;
  image?: string;
  extraImages?: string[];
  price?: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
  details?: string;
  colors?: string[];
  options?: string[];
}): string {
  const brandId =
    typeof phone.brand === "string" ? phone.brand : String(phone.brand?._id || "");
  return snapshotCreatePayload(
    buildPhoneCreateComparePayload({
      phoneName: phone.name,
      selectedBrand: brandId,
      image: phone.image || "",
      extraImagesText: (phone.extraImages || []).join("\n"),
      price: phone.price != null ? String(phone.price) : "",
      priceRetail: phone.priceRetail != null ? String(phone.priceRetail) : "",
      priceWholesale: phone.priceWholesale != null ? String(phone.priceWholesale) : "",
      priceReparateur: phone.priceReparateur != null ? String(phone.priceReparateur) : "",
      details: phone.details || "",
      selectedColors: Array.isArray(phone.colors) ? [...phone.colors] : [],
      options: Array.isArray(phone.options) ? [...phone.options] : [],
    })
  );
}

export function buildAccessoryCreateComparePayload(args: {
  name: string;
  selectedType: string;
  selectedBrand: string;
  selectedPhoneTypes: string[];
  image: string;
  extraImagesText: string;
  colors: string[];
  price: string;
  priceRetail: string;
  priceWholesale: string;
  priceReparateur: string;
  stock: string;
  details: string;
  options: string[];
}): Record<string, unknown> {
  return {
    name: args.name.trim(),
    type: args.selectedType,
    brand: String(args.selectedBrand).trim(),
    phoneTypes: [...args.selectedPhoneTypes],
    image: args.image.trim(),
    extraImages: parseExtraImagesLines(args.extraImagesText),
    colors: [...args.colors],
    price: args.price.trim() ? Number(args.price) : 0,
    priceRetail: args.priceRetail.trim() ? Number(args.priceRetail) : undefined,
    priceWholesale: args.priceWholesale.trim() ? Number(args.priceWholesale) : undefined,
    priceReparateur: args.priceReparateur.trim() ? Number(args.priceReparateur) : undefined,
    stock: args.stock.trim() ? Number(args.stock) : 0,
    details: args.details.trim(),
    options: args.options.map((x) => String(x || "").trim()).filter(Boolean),
  };
}

type AccessoryLike = {
  name: string;
  type: { _id: string } | string;
  brand?: { _id: string } | string;
  phoneTypes?: unknown;
  phoneType?: unknown;
  image?: string;
  extraImages?: string[];
  colors?: string[];
  price?: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
  stock?: number;
  details?: string;
};

function accessoryBrandId(item: AccessoryLike): string {
  const b = item.brand;
  if (typeof b === "object" && b && "_id" in b) return String((b as { _id: string })._id);
  if (typeof b === "string") return b;
  return "";
}

function accessoryTypeId(item: AccessoryLike): string {
  const t = item.type;
  if (typeof t === "object" && t !== null && "_id" in t) return String((t as { _id: string })._id);
  return String(t ?? "");
}

/**
 * لقطة بعد تجهيز قائمة الموديلات ومصفوفة الموديلات المختارة (نفس منطق النسخ في الواجهة).
 */
export function snapshotAccessoryAfterModelsResolved(
  item: AccessoryLike,
  selectedPhoneTypes: string[]
): string {
  const bid = accessoryBrandId(item);
  return snapshotCreatePayload(
    buildAccessoryCreateComparePayload({
      name: item.name,
      selectedType: accessoryTypeId(item),
      selectedBrand: bid,
      selectedPhoneTypes,
      image: item.image || "",
      extraImagesText: (item.extraImages || []).join("\n"),
      price: item.price != null ? String(item.price) : "",
      priceRetail: item.priceRetail != null ? String(item.priceRetail) : "",
      priceWholesale: item.priceWholesale != null ? String(item.priceWholesale) : "",
      priceReparateur: item.priceReparateur != null ? String(item.priceReparateur) : "",
      stock: item.stock != null ? String(item.stock) : "",
      details: item.details || "",
      colors: Array.isArray(item.colors) ? [...item.colors] : [],
      options: Array.isArray((item as { options?: string[] }).options)
        ? [...((item as { options?: string[] }).options || [])]
        : [],
    })
  );
}

export function buildSparePartManualCreateComparePayload(args: {
  name: string;
  details: string;
  image: string;
  extraImagesText: string;
  price: string;
  priceRetail: string;
  priceWholesale: string;
  priceReparateur: string;
  selectedBrand: string;
  selectedPhoneTypes: string[];
  newPhoneTypeName: string;
  selectedSpareColors: string[];
  options: string[];
}): Record<string, unknown> {
  const normalizedDetails = args.details.trim();
  const phoneTypesSorted = [...args.selectedPhoneTypes].slice().sort();
  const payload: Record<string, unknown> = {
    name: args.name.trim(),
    details: normalizedDetails,
    description: normalizedDetails,
    image: args.image.trim(),
    extraImages: parseExtraImagesLines(args.extraImagesText),
    price: args.price.trim() ? Number(args.price) : 0,
    priceRetail: args.priceRetail.trim() ? Number(args.priceRetail) : undefined,
    priceWholesale: args.priceWholesale.trim() ? Number(args.priceWholesale) : undefined,
    priceReparateur: args.priceReparateur.trim() ? Number(args.priceReparateur) : undefined,
    colors: [...args.selectedSpareColors],
    options: args.options.map((x) => String(x || "").trim()).filter(Boolean),
    creationSource: "manual",
    brand: args.selectedBrand || null,
    phoneTypes: phoneTypesSorted,
  };
  if (phoneTypesSorted.length === 0 && args.newPhoneTypeName.trim()) {
    payload.phoneTypeName = args.newPhoneTypeName.trim();
  }
  return payload;
}

export function snapshotFromSparePartForCopy(p: {
  name: string;
  details?: string;
  image?: string;
  extraImages?: string[];
  price: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
  brand?: { _id?: string } | string | null;
  phoneType?: { _id?: string } | string | null;
  phoneTypes?: Array<{ _id?: string } | string>;
  colors?: string[];
}): string {
  const brandId =
    typeof p.brand === "string" ? p.brand : p.brand && typeof p.brand === "object" ? String(p.brand._id || "") : "";
  const phoneTypeIdsFromArray: string[] = [];
  if (Array.isArray(p.phoneTypes)) {
    for (const pt of p.phoneTypes) {
      const id =
        typeof pt === "string"
          ? pt
          : pt && typeof pt === "object"
            ? String(pt._id || "")
            : "";
      if (id) phoneTypeIdsFromArray.push(id);
    }
  }
  const fallbackSingle =
    typeof p.phoneType === "string"
      ? p.phoneType
      : p.phoneType && typeof p.phoneType === "object"
        ? String(p.phoneType._id || "")
        : "";
  const selectedPhoneTypes =
    phoneTypeIdsFromArray.length > 0
      ? phoneTypeIdsFromArray
      : fallbackSingle
        ? [fallbackSingle]
        : [];
  return snapshotCreatePayload(
    buildSparePartManualCreateComparePayload({
      name: p.name,
      details: p.details || "",
      image: (p.image as string) || "",
      extraImagesText: (p.extraImages || []).join("\n"),
      price: String(p.price ?? ""),
      priceRetail: p.priceRetail != null ? String(p.priceRetail) : "",
      priceWholesale: p.priceWholesale != null ? String(p.priceWholesale) : "",
      priceReparateur: p.priceReparateur != null ? String(p.priceReparateur) : "",
      selectedBrand: brandId || "",
      selectedPhoneTypes,
      newPhoneTypeName: "",
      selectedSpareColors: Array.isArray(p.colors) ? [...p.colors] : [],
      options: Array.isArray((p as { options?: string[] }).options)
        ? [...((p as { options?: string[] }).options || [])]
        : [],
    })
  );
}
