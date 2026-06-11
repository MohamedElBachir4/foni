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

export function resolveUseWholesalePricing(account: {
  role?: string;
  useWholesalePricing?: boolean;
} | null): boolean {
  if (!account || !isMerchantRole(account.role)) return false;
  const legacy = String(account.role || "").trim().toLowerCase();
  if (LEGACY_WHOLESALE.has(legacy)) return true;
  return account.useWholesalePricing === true;
}

export function roleLabelAr(role: string | undefined | null): string {
  return isMerchantRole(role) ? "تاجر أو صاحب محل" : "زبون";
}

export function checkoutRoleLabel(account: {
  role?: string;
  useWholesalePricing?: boolean;
} | null): string {
  if (!account) return "زبون";
  if (!isMerchantRole(account.role)) return "زبون";
  if (resolveUseWholesalePricing(account)) return "تاجر — شراء بالجملة";
  return "تاجر أو صاحب محل";
}
