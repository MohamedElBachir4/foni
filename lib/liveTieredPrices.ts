"use client";

import { useEffect, useState } from "react";
import { publicFetch } from "@/lib/publicFetch";
import {
  parsePricedVariantsFromApi,
  type PricedVariant,
} from "@/lib/productPricedOptions";

export type LiveProductType = "phone" | "accessory" | "sparePart" | "maintenanceTool";

export type LiveTiers = {
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
  pricedOptions: PricedVariant[];
};

const ENDPOINTS: Record<LiveProductType, string> = {
  phone: "/api/phones",
  accessory: "/api/accessories",
  sparePart: "/api/spare-parts",
  maintenanceTool: "/api/maintenance-tools",
};

function num(v: unknown): number | undefined {
  const n = Number(v);
  return v != null && v !== "" && Number.isFinite(n) ? n : undefined;
}

/** أسعار المنتج كما يراها الحساب الحالي (الطلب يحمل رمز الحساب تلقائياً). */
export async function fetchLiveTiers(
  productType: LiveProductType,
  id: string
): Promise<LiveTiers | null> {
  try {
    const res = await publicFetch(`${ENDPOINTS[productType]}/${encodeURIComponent(id)}`, {
      cache: "no-store",
      maxRetries: 1,
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || typeof data !== "object") return null;
    return {
      priceRetail: num(data.priceRetail) ?? num(data.price),
      priceWholesale: num(data.priceWholesale),
      priceReparateur: num(data.priceReparateur),
      pricedOptions: parsePricedVariantsFromApi(data.pricedOptions),
    };
  } catch {
    return null;
  }
}

/**
 * يعيد جلب أسعار مجموعة منتجات بعد تغيّر الحساب — للقوائم المجلوبة على السيرفر بدون رمز الحساب
 * (تعود فيها أسعار التجزئة فقط).
 */
export function useLiveTiers(
  productType: LiveProductType,
  ids: string[],
  accountKey: string | null
): Record<string, LiveTiers> {
  const [state, setState] = useState<{ key: string; tiers: Record<string, LiveTiers> }>({
    key: "",
    tiers: {},
  });
  const idsKey = ids.join(",");
  const requestKey = accountKey && idsKey ? `${productType}|${accountKey}|${idsKey}` : "";

  useEffect(() => {
    if (!requestKey) return;
    let cancelled = false;
    const list = idsKey.split(",");
    Promise.all(list.map((id) => fetchLiveTiers(productType, id))).then((results) => {
      if (cancelled) return;
      const next: Record<string, LiveTiers> = {};
      results.forEach((r, i) => {
        if (r) next[list[i]!] = r;
      });
      setState({ key: requestKey, tiers: next });
    });
    return () => {
      cancelled = true;
    };
  }, [productType, idsKey, requestKey]);

  return requestKey && state.key === requestKey ? state.tiers : EMPTY_TIERS;
}

const EMPTY_TIERS: Record<string, LiveTiers> = {};
