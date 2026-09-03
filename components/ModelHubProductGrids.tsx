"use client";

import { useEffect, useMemo, useState } from "react";
import { Smartphone, Headphones, Wrench } from "lucide-react";
import { ProductGridCard } from "@/components/ProductGridCard";
import { useAccount } from "@/context/AccountContext";
import { getEffectivePrice, getPricingAccount } from "@/lib/pricing";
import { publicFetch } from "@/lib/publicFetch";

type HubProduct = {
  _id: string;
  name: string;
  image?: string;
  price?: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
  createdAt?: string;
};

export type ModelHubCategory = "phones" | "accessories" | "spare-parts";

type ModelHubProductGridsProps = {
  brandMongoId: string;
  phoneTypeId: string;
  only?: ModelHubCategory;
};

function sortByNewest(items: HubProduct[]): HubProduct[] {
  return [...items].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
}

function ProductGridSection({
  title,
  icon,
  category,
  items,
  loading,
  hideTitle = false,
}: {
  title: string;
  icon: React.ReactNode;
  category: string;
  items: HubProduct[];
  loading: boolean;
  hideTitle?: boolean;
}) {
  const { account } = useAccount();
  const pricingAccount = useMemo(() => getPricingAccount(account), [account]);

  return (
    <div>
      {hideTitle ? null : (
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
          {icon}
          {title}
        </h2>
      )}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
          جاري التحميل...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
          لا توجد منتجات لهذا الموديل حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {items.map((item) => {
            const effectivePrice = getEffectivePrice(
              {
                price: item.price,
                priceRetail: item.priceRetail ?? item.price,
                priceWholesale: item.priceWholesale,
                priceReparateur: item.priceReparateur,
              },
              pricingAccount
            );
            return (
              <ProductGridCard
                key={item._id}
                product={{
                  id: item._id,
                  name: item.name,
                  image: item.image || "/LOGO.jpeg",
                  price: item.price ?? 0,
                  priceRetail: item.priceRetail ?? item.price,
                  priceWholesale: item.priceWholesale,
                  priceReparateur: item.priceReparateur,
                  brand: "",
                  category,
                }}
                effectivePrice={effectivePrice}
                imageSizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                className="hover:-translate-y-1"
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function emptyList(): Promise<HubProduct[]> {
  return Promise.resolve([]);
}

export function ModelHubProductGrids({
  brandMongoId,
  phoneTypeId,
  only,
}: ModelHubProductGridsProps) {
  const { account } = useAccount();
  const accountFetchKey = account?.id ?? "guest";
  const [phones, setPhones] = useState<HubProduct[]>([]);
  const [accessories, setAccessories] = useState<HubProduct[]>([]);
  const [spareParts, setSpareParts] = useState<HubProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const showPhones = !only || only === "phones";
  const showAccessories = !only || only === "accessories";
  const showSpareParts = !only || only === "spare-parts";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      showPhones
        ? publicFetch(
            `/api/phones?brand=${encodeURIComponent(brandMongoId)}&phoneType=${encodeURIComponent(phoneTypeId)}`,
            { cache: "no-store" }
          )
            .then(async (res) => (res.ok ? ((await res.json()) as HubProduct[]) : []))
            .catch(() => [])
        : emptyList(),
      showAccessories
        ? publicFetch(
            `/api/accessories?phoneType=${encodeURIComponent(phoneTypeId)}`,
            { cache: "no-store" }
          )
            .then(async (res) => (res.ok ? ((await res.json()) as HubProduct[]) : []))
            .catch(() => [])
        : emptyList(),
      showSpareParts
        ? publicFetch(
            `/api/spare-parts?brand=${encodeURIComponent(brandMongoId)}&phoneType=${encodeURIComponent(phoneTypeId)}&limit=1000&sort=newest`,
            { cache: "no-store" }
          )
            .then(async (res) => {
              if (!res.ok) return [];
              const data = await res.json();
              return (Array.isArray(data?.parts) ? data.parts : []) as HubProduct[];
            })
            .catch(() => [])
        : emptyList(),
    ]).then(([p, a, s]) => {
      if (cancelled) return;
      setPhones(p);
      setAccessories(a);
      setSpareParts(sortByNewest(s));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [brandMongoId, phoneTypeId, accountFetchKey, showPhones, showAccessories, showSpareParts]);

  return (
    <section className="space-y-10">
      {showPhones ? (
        <ProductGridSection
          title="الهواتف"
          icon={<Smartphone className="h-5 w-5 text-blue-600" />}
          category="هواتف"
          items={phones}
          loading={loading}
          hideTitle={only === "phones"}
        />
      ) : null}
      {showSpareParts ? (
        <ProductGridSection
          title="قطع الغيار"
          icon={<Wrench className="h-5 w-5 text-emerald-600" />}
          category="قطع غيار"
          items={spareParts}
          loading={loading}
          hideTitle={only === "spare-parts"}
        />
      ) : null}
      {showAccessories ? (
        <ProductGridSection
          title="الإكسسوارات"
          icon={<Headphones className="h-5 w-5 text-fuchsia-600" />}
          category="أكسسوارات"
          items={accessories}
          loading={loading}
          hideTitle={only === "accessories"}
        />
      ) : null}
    </section>
  );
}
