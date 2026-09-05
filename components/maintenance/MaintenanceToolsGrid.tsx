"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductGridCard } from "@/components/ProductGridCard";
import { useAccount } from "@/context/AccountContext";
import { getEffectivePrice, getPricingAccount } from "@/lib/pricing";
import { publicFetch } from "@/lib/publicFetch";
import { slugifyProductName } from "@/lib/seo";

type MaintenanceTool = {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  price?: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=600&q=80";

export function MaintenanceToolsGrid({ tools: initialTools }: { tools: MaintenanceTool[] }) {
  const { account } = useAccount();
  const accountFetchKey = account?.id ?? "guest";
  const [tools, setTools] = useState(initialTools);

  useEffect(() => {
    setTools(initialTools);
  }, [initialTools]);

  useEffect(() => {
    let cancelled = false;
    publicFetch("/api/maintenance-tools", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (cancelled) return;
        setTools(Array.isArray(data) ? (data as MaintenanceTool[]) : []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [accountFetchKey]);

  const pricingAccount = useMemo(() => getPricingAccount(account), [account]);

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-6">
      {tools.map((tool, index) => {
        const effectivePrice = getEffectivePrice(
          {
            price: tool.price,
            priceRetail: tool.priceRetail,
            priceWholesale: tool.priceWholesale,
            priceReparateur: tool.priceReparateur,
          },
          pricingAccount
        );
        return (
          <ProductGridCard
            key={tool._id}
            product={{
              id: tool._id,
              name: tool.name,
              image: tool.image || FALLBACK_IMAGE,
              price: tool.price ?? 0,
              priceRetail: tool.priceRetail ?? tool.price,
              priceWholesale: tool.priceWholesale,
              priceReparateur: tool.priceReparateur,
              brand: "",
              category: "أدوات الصيانة",
              detailHref: `/product/${tool._id}/${slugifyProductName(tool.name)}`,
            }}
            effectivePrice={effectivePrice ?? 0}
            index={index}
            imageSizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="hover:-translate-y-1"
          />
        );
      })}
    </section>
  );
}
