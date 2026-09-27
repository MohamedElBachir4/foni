"use client";

import { useEffect } from "react";
import { useAccount } from "@/context/AccountContext";
import { isMerchantRole, resolvePriceMode } from "@/lib/accountRoles";
import { getPricingAccount } from "@/lib/pricing";

/**
 * زبون / زائر أو تاجر في وضع التجزئة → أزرق (افتراضي)
 * تاجر في وضع أسعار التجار → برتقالي
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
      const mode = resolvePriceMode(pricing);
      accent = mode === "wholesale" ? "wholesale" : mode === "merchant" ? "merchant" : "customer";
    }

    root.dataset.accent = accent;
  }, [account, hydrated]);

  return null;
}
