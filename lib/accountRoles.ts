/** أدوار الحساب في الواجهة — customer | merchant */

export type AccountRole = "customer" | "merchant";

const LEGACY_MERCHANT = new Set(["reparateur", "repair", "merchant"]);
const LEGACY_WHOLESALE = new Set(["grossiste", "wholesale"]);

export function normalizeAccountRole(role: string | undefined | null): AccountRole {
  const r = String(role || "").trim().toLowerCase();
  if (r === "customer") return "customer";
  if (LEGACY_WHOLESALE.has(r) || LEGACY_MERCHANT.has(r)) return "merchant";
  return "customer";
}

export function isMerchantRole(role: string | undefined | null): boolean {
  return normalizeAccountRole(role) === "merchant";
}

/** أوضاع عرض الأسعار التي يختارها التاجر من الزر العلوي */
export type PriceMode = "wholesale" | "merchant" | "retail";

export const PRICE_MODES: PriceMode[] = ["wholesale", "merchant", "retail"];

/** شريحة السعر المطبّقة لكل وضع */
export const PRICE_MODE_TIER: Record<PriceMode, "wholesale" | "repair" | "retail"> = {
  wholesale: "wholesale",
  merchant: "repair",
  retail: "retail",
};

type PriceModeAccount = {
  role?: string;
  useWholesalePricing?: boolean;
  priceMode?: string | null;
} | null;

function isPriceMode(value: unknown): value is PriceMode {
  return PRICE_MODES.includes(value as PriceMode);
}

export function resolvePriceMode(account: PriceModeAccount): PriceMode {
  if (!account || !isMerchantRole(account.role)) return "retail";
  if (isPriceMode(account.priceMode)) return account.priceMode;
  const legacy = String(account.role || "").trim().toLowerCase();
  if (LEGACY_WHOLESALE.has(legacy)) return "wholesale";
  // نقبل true أو "true" أو 1 لتفادي مشاكل تحويل النوع من قاعدة البيانات
  const val = account.useWholesalePricing as unknown;
  return val === true || val === 1 || val === "true" ? "wholesale" : "merchant";
}

export function resolveUseWholesalePricing(account: PriceModeAccount): boolean {
  return resolvePriceMode(account) === "wholesale";
}

/** ترتيب الزر العلوي: جملة ← تجار ← تجزئة ← جملة */
export function nextPriceMode(mode: PriceMode): PriceMode {
  if (mode === "wholesale") return "merchant";
  if (mode === "merchant") return "retail";
  return "wholesale";
}

export function priceModeActivateLabel(mode: PriceMode): string {
  if (mode === "wholesale") return "تفعيل أسعار الجملة";
  if (mode === "merchant") return "تفعيل أسعار التجار";
  return "تفعيل أسعار التجزئة";
}

export function priceModeActiveLabel(mode: PriceMode): string {
  if (mode === "wholesale") return "مفعّل: أسعار الجملة";
  if (mode === "merchant") return "مفعّل: أسعار التجار";
  return "مفعّل: أسعار التجزئة";
}

export function roleLabelAr(role: string | undefined | null): string {
  return isMerchantRole(role) ? "تاجر أو صاحب محل" : "زبون";
}

export function checkoutRoleLabel(account: PriceModeAccount): string {
  if (!account) return "زبون";
  if (!isMerchantRole(account.role)) return "زبون";
  if (resolveUseWholesalePricing(account)) return "تاجر — شراء بالجملة";
  return "تاجر أو صاحب محل";
}
