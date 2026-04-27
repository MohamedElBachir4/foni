import type { AccountInfo } from "@/context/AccountContext";

export type TieredPrice = {
  price?: number | null;
  priceRetail?: number | null;
  priceWholesale?: number | null;
  priceReparateur?: number | null;
};

export function getEffectivePrice(
  tiered: TieredPrice,
  account: AccountInfo | null
): number {
  const baseRetail =
    (typeof tiered.priceRetail === "number" && !Number.isNaN(tiered.priceRetail)
      ? tiered.priceRetail
      : typeof tiered.price === "number" && !Number.isNaN(tiered.price)
      ? tiered.price
      : 0) || 0;

  if (!account) return baseRetail;

  if (account.role === "grossiste") {
    const v =
      typeof tiered.priceWholesale === "number" && !Number.isNaN(tiered.priceWholesale)
        ? tiered.priceWholesale
        : null;
    return v ?? baseRetail;
  }

  if (account.role === "reparateur") {
    if (account.useWholesalePricing) {
      const wholesale =
        typeof tiered.priceWholesale === "number" &&
        !Number.isNaN(tiered.priceWholesale)
          ? tiered.priceWholesale
          : null;
      return wholesale ?? baseRetail;
    }
    const v =
      typeof tiered.priceReparateur === "number" &&
      !Number.isNaN(tiered.priceReparateur)
        ? tiered.priceReparateur
        : null;
    return v ?? baseRetail;
  }

  return baseRetail;
}

/**
 * تنسيق السعر لعرض الواجهة: بدون فواصل عند الآلاف (لا «15,000») — يلحق بـ «DA» في الواجهة
 */
export function formatDzd(n: number | null | undefined): string {
  const v = n == null ? NaN : Number(n);
  if (Number.isNaN(v)) return "0";
  return new Intl.NumberFormat("en-US", {
    useGrouping: false,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(v);
}

