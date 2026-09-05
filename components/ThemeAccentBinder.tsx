"use client";

import { useEffect } from "react";
import { useAccount } from "@/context/AccountContext";
import { isMerchantRole, resolveUseWholesalePricing } from "@/lib/accountRoles";
import { getPricingAccount } from "@/lib/pricing";

/**
 * زبون / زائر → أزرق (افتراضي)
 * تاجر بدون جملة → برتقالي
 * تاجر مع أسعار الجملة → أحمر
 */
export function ThemeAccentBinder() {
  const { account, hydrated } = useAccount();

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    const pricing = getPricingAccount(account);

    let accent: "customer" | "merchant" | "wholesale" = "customer";
    if (pricing && isMerchantRole(pricing.role)) {
      accent = resolveUseWholesalePricing(pricing) ? "wholesale" : "merchant";
    }

    root.dataset.accent = accent;
  }, [account, hydrated]);

  return null;
}
