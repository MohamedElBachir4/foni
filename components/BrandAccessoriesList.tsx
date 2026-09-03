"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductGridCard } from "@/components/ProductGridCard";
import { useAccount } from "@/context/AccountContext";
import { filterAccessoriesForBrandPage } from "@/lib/accessoryVisibility";
import { getEffectivePrice, getPricingAccount } from "@/lib/pricing";
import { publicFetch } from "@/lib/publicFetch";

type Accessory = {
  _id: string;
  name: string;
  image?: string;
  price?: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
  colors?: string[];
  options?: string[];
};

export function BrandAccessoriesList({
  accessories: initialAccessories,
  apiPath,
  phoneTypeFilterId,
}: {
  accessories: Accessory[];
  /** عند التوفير: إعادة جلب القائمة من المتصفح مع توكن الحساب لأسعار التاجر/الجملة */
  apiPath?: string;
  phoneTypeFilterId?: string | null;
}) {
  const { account } = useAccount();
  const accountFetchKey = account?.id ?? "guest";
  const [accessories, setAccessories] = useState(initialAccessories);

  useEffect(() => {
    setAccessories(initialAccessories);
  }, [initialAccessories]);

  useEffect(() => {
    if (!apiPath) return;
    let cancelled = false;
    publicFetch(apiPath, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (cancelled) return;
        let list = Array.isArray(data) ? (data as Accessory[]) : [];
        if (phoneTypeFilterId !== undefined) {
          list = filterAccessoriesForBrandPage(
            list as { phoneTypes?: unknown; phoneType?: unknown }[],
            phoneTypeFilterId
          ) as Accessory[];
        }
        setAccessories(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [apiPath, accountFetchKey, phoneTypeFilterId]);

  const pricingAccount = useMemo(() => getPricingAccount(account), [account]);

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-6">
      {accessories.map((a) => {
        const effectivePrice = getEffectivePrice(
          {
            price: a.price,
            priceRetail: a.priceRetail,
            priceWholesale: a.priceWholesale,
            priceReparateur: a.priceReparateur,
          },
          pricingAccount
        );
        return (
          <ProductGridCard
            key={a._id}
            product={{
              id: a._id,
              name: a.name,
              image:
                a.image ||
                "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80",
              price: a.price ?? 0,
              priceRetail: a.priceRetail ?? a.price,
              priceWholesale: a.priceWholesale,
              priceReparateur: a.priceReparateur,
              colors: Array.isArray(a.colors) ? a.colors : [],
              options: Array.isArray(a.options) ? a.options : [],
              brand: "",
              category: "أكسسوارات",
            }}
            effectivePrice={effectivePrice ?? 0}
            imageSizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="hover:-translate-y-1"
          />
        );
      })}
    </section>
  );
}
