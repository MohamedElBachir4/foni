/**
 * تفضيلات التوصيل لزوار غير مسجلي الدخول (localStorage فقط).
 * المستخدم المسجل: يُحدَّث الحساب في الخادم عند كل طلب ناجح.
 */

const STORAGE_KEY = "foni_guest_checkout_shipping";

export type GuestCheckoutShippingPrefsV1 = {
  v: 1;
  fullName: string;
  phone: string;
  address: string;
  wilayaId: number;
  communeName: string;
  /** تعريف بلدية Yalidine عند وجوده — يضمن مطابقة الحقل بعد جلب القائمة */
  communeId: number | null;
  deliveryType: "home" | "stopdesk";
  stopdeskId: number | null;
  savedAt: string;
};

function isPrefsV1(raw: unknown): raw is GuestCheckoutShippingPrefsV1 {
  if (!raw || typeof raw !== "object") return false;
  const r = raw as Record<string, unknown>;
  return (
    r.v === 1 &&
    typeof r.fullName === "string" &&
    typeof r.phone === "string" &&
    typeof r.address === "string" &&
    typeof r.wilayaId === "number" &&
    Number.isFinite(r.wilayaId) &&
    typeof r.communeName === "string" &&
    (r.deliveryType === "home" || r.deliveryType === "stopdesk") &&
    (typeof r.savedAt === "string" || r.savedAt === undefined || r.savedAt === null)
  );
}

/** يفرّغ التخزين المحلي عند تسجيل الدخول لتجنّب خلط البيانات مع ما يقرأ من الحساب */
export function clearGuestCheckoutShippingPrefs(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function loadGuestCheckoutShippingPrefs(): GuestCheckoutShippingPrefsV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isPrefsV1(parsed)) return null;
    const communeIdParsed =
      parsed.communeId != null &&
      typeof parsed.communeId === "number" &&
      Number.isFinite(parsed.communeId)
        ? parsed.communeId
        : null;
    return {
      ...parsed,
      communeId: communeIdParsed,
      stopdeskId:
        parsed.stopdeskId != null &&
        parsed.stopdeskId !== "" &&
        Number.isFinite(Number(parsed.stopdeskId))
          ? Number(parsed.stopdeskId)
          : null,
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : "",
    };
  } catch {
    return null;
  }
}

export type SaveGuestCheckoutShippingInput = {
  fullName: string;
  phone: string;
  address: string;
  wilayaId: number;
  communeName: string;
  communeId: number | null;
  deliveryType: "home" | "stopdesk";
  stopdeskId: number | null;
};

export function saveGuestCheckoutShippingPrefs(input: SaveGuestCheckoutShippingInput): void {
  if (typeof window === "undefined") return;
  const cid =
    input.communeId != null && Number.isFinite(Number(input.communeId))
      ? Number(input.communeId)
      : null;
  const payload: GuestCheckoutShippingPrefsV1 = {
    v: 1,
    fullName: String(input.fullName || "").trim(),
    phone: String(input.phone || "").trim(),
    address: String(input.address || "").trim(),
    wilayaId: Number(input.wilayaId),
    communeName: String(input.communeName || "").trim(),
    communeId: cid,
    deliveryType: input.deliveryType === "stopdesk" ? "stopdesk" : "home",
    stopdeskId:
      input.deliveryType === "stopdesk" &&
      input.stopdeskId != null &&
      Number.isFinite(Number(input.stopdeskId))
        ? Number(input.stopdeskId)
        : null,
    savedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
}
