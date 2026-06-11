import type { AccountInfo } from "@/context/AccountContext";
import type { PricedVariant } from "@/lib/productPricedOptions";
import {
  isMerchantRole,
  resolveUseWholesalePricing,
} from "@/lib/accountRoles";

export type TieredPrice = {
  price?: number | null;
  priceRetail?: number | null;
  priceWholesale?: number | null;
  priceReparateur?: number | null;
};

/** لا يُطبَّق سوى سعر التجزئة قبل موافقة الأدمن على حساب التاجر (أو بعد الرفض). */
export function getPricingAccount(account: AccountInfo | null): AccountInfo | null {
  if (!account) return null;
  const s = account.approvalStatus;
  if (isMerchantRole(account.role) && (s === "pending" || s === "rejected")) {
    return null;
  }
  return account;
}

/**
 * سعر الواجهة حسب نوع الحساب:
 * - زبون أو بدون حساب ← تجزئة
 * - تاجر/صاحب محل معتمد بدون شراء بالجملة ← سعر reparateur
 * - تاجر/صاحب محل مع تفعيل «الشراء بالجملة» ← جملة
 */
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

  const pricingAccount = getPricingAccount(account);
  if (!pricingAccount) return baseRetail;

  if (isMerchantRole(pricingAccount.role)) {
    if (resolveUseWholesalePricing(pricingAccount)) {
      const wholesale =
        typeof tiered.priceWholesale === "number" &&
        !Number.isNaN(tiered.priceWholesale)
          ? tiered.priceWholesale
          : null;
      return wholesale ?? baseRetail;
    }
    const repair =
      typeof tiered.priceReparateur === "number" &&
      !Number.isNaN(tiered.priceReparateur)
        ? tiered.priceReparateur
        : null;
    return repair ?? baseRetail;
  }

  return baseRetail;
}

export function getEffectivePriceForVariant(
  variant: PricedVariant,
  account: AccountInfo | null
): number {
  return getEffectivePrice(
    {
      price: variant.retailPrice,
      priceRetail: variant.retailPrice,
      priceWholesale: variant.wholesalePrice,
      priceReparateur: variant.repairPrice,
    },
    account
  );
}

export function describeActivePriceTier(account: AccountInfo | null): string {
  const acc = getPricingAccount(account);
  if (!acc) return "سعر التجزئة — العرض العام";
  if (isMerchantRole(acc.role)) {
    return resolveUseWholesalePricing(acc)
      ? "سعر الجملة — بعد تفعيل الشراء بالجملة"
      : "سعر تاجر أو صاحب محل — حسابك";
  }
  return "سعر التجزئة — حسابك";
}

export function formatDzd(n: number | null | undefined): string {
  const v = n == null ? NaN : Number(n);
  if (Number.isNaN(v)) return "0";
  return new Intl.NumberFormat("en-US", {
    useGrouping: false,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(v);
}

export type CartPriceTiers = {
  price?: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
};

export type CartVariantPriceTiers = {
  label: string;
  price: number;
  quantity: number;
  retailPrice?: number;
  wholesalePrice?: number;
  repairPrice?: number;
};

/** سعر وحدة سطر السلة حسب الحساب الحالي (مع fallback للسعر المخزّن). */
export function resolveCartLineUnitPrice(
  tiers: CartPriceTiers,
  account: AccountInfo | null
): number {
  const hasTiers =
    tiers.priceRetail != null ||
    tiers.priceWholesale != null ||
    tiers.priceReparateur != null;
  if (!hasTiers) return Math.max(0, Number(tiers.price) || 0);
  return getEffectivePrice(tiers, account);
}

export function resolveCartVariantUnitPrice(
  variant: CartVariantPriceTiers,
  account: AccountInfo | null
): number {
  const hasTiers =
    variant.retailPrice != null ||
    variant.wholesalePrice != null ||
    variant.repairPrice != null;
  if (!hasTiers) return Math.max(0, Number(variant.price) || 0);
  return getEffectivePrice(
    {
      price: variant.retailPrice ?? variant.price,
      priceRetail: variant.retailPrice ?? variant.price,
      priceWholesale: variant.wholesalePrice,
      priceReparateur: variant.repairPrice,
    },
    account
  );
}
