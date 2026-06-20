"use client";

import { useEffect, useMemo, useState } from "react";
import { Smartphone, Headphones, Wrench, Heart } from "lucide-react";
import { ProductImage } from "@/components/ProductImage";
import { ProductCardActions } from "@/components/ProductCardActions";
import { useAccount } from "@/context/AccountContext";
import { formatDzd, getEffectivePrice, getPricingAccount } from "@/lib/pricing";
import { publicFetch } from "@/lib/publicFetch";

type HubProduct = {
  _id: string;
  name: string;
  image?: string;
  price?: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
};

type ModelHubProductGridsProps = {
  brandMongoId: string;
  phoneTypeId: string;
};

function ProductGridSection({
  title,
  icon,
  badge,
  category,
  items,
  loading,
}: {
  title: string;
  icon: React.ReactNode;
  badge: string;
  category: string;
  items: HubProduct[];
  loading: boolean;
}) {
  const { account } = useAccount();
  const pricingAccount = useMemo(() => getPricingAccount(account), [account]);

  return (
    <div>
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
        {icon}
        {title}
      </h2>
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
              <article
                key={item._id}
                className="group flex h-full min-h-0 flex-col overflow-visible rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl sm:overflow-hidden sm:rounded-[1.25rem]"
              >
                <div className="relative flex h-[180px] shrink-0 items-center justify-center bg-gradient-to-b from-slate-50 to-white px-3 py-3 sm:h-[220px] sm:py-4">
                  <ProductImage
                    src={item.image || "/LOGO.jpeg"}
                    alt={item.name}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="h-full w-full object-contain p-2 sm:p-3"
                  />
                  <span className="absolute start-3 top-3 rounded-lg bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm sm:start-4 sm:top-4 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs">
                    {badge}
                  </span>
                  <button
                    type="button"
                    aria-label="إضافة للمفضلة"
                    className="absolute end-3 top-3 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-red-500 sm:end-4 sm:top-4 sm:p-2"
                  >
                    <Heart className="h-4 w-4 text-slate-500 sm:h-5 sm:w-5" strokeWidth={1.5} />
                  </button>
                </div>
                <div className="flex min-h-0 flex-1 flex-col border-t border-slate-100 p-3">
                  <h3 className="mb-2 break-words text-center text-sm font-bold leading-snug text-slate-900 sm:line-clamp-2 sm:text-base">
                    {item.name}
                  </h3>
                  <p className="mb-2 text-center">
                    <span className="text-xl font-black text-slate-900 sm:text-2xl">
                      {formatDzd(effectivePrice)}
                    </span>
                    <span className="mr-1 text-sm font-semibold text-slate-500">DA</span>
                  </p>
                  <ProductCardActions
                    id={item._id}
                    name={item.name}
                    price={effectivePrice}
                    priceRetail={item.priceRetail ?? item.price}
                    priceWholesale={item.priceWholesale}
                    priceReparateur={item.priceReparateur}
                    image={item.image || ""}
                    category={category}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ModelHubProductGrids({
  brandMongoId,
  phoneTypeId,
}: ModelHubProductGridsProps) {
  const { account } = useAccount();
  const accountFetchKey = account?.id ?? "guest";
  const [phones, setPhones] = useState<HubProduct[]>([]);
  const [accessories, setAccessories] = useState<HubProduct[]>([]);
  const [spareParts, setSpareParts] = useState<HubProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      publicFetch(
        `/api/phones?brand=${encodeURIComponent(brandMongoId)}&phoneType=${encodeURIComponent(phoneTypeId)}`,
        { cache: "no-store" }
      )
        .then(async (res) => (res.ok ? ((await res.json()) as HubProduct[]) : []))
        .catch(() => []),
      publicFetch(
        `/api/accessories?brand=${encodeURIComponent(brandMongoId)}&phoneType=${encodeURIComponent(phoneTypeId)}`,
        { cache: "no-store" }
      )
        .then(async (res) => (res.ok ? ((await res.json()) as HubProduct[]) : []))
        .catch(() => []),
      publicFetch(
        `/api/spare-parts?brand=${encodeURIComponent(brandMongoId)}&phoneType=${encodeURIComponent(phoneTypeId)}&limit=200`,
        { cache: "no-store" }
      )
        .then(async (res) => {
          if (!res.ok) return [];
          const data = await res.json();
          return (Array.isArray(data?.parts) ? data.parts : []) as HubProduct[];
        })
        .catch(() => []),
    ]).then(([p, a, s]) => {
      if (cancelled) return;
      setPhones(p);
      setAccessories(a);
      setSpareParts(s);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [brandMongoId, phoneTypeId, accountFetchKey]);

  return (
    <section className="space-y-10">
      <ProductGridSection
        title="الهواتف"
        icon={<Smartphone className="h-5 w-5 text-blue-600" />}
        badge="هواتف"
        category="هواتف"
        items={phones}
        loading={loading}
      />
      <ProductGridSection
        title="قطع الغيار"
        icon={<Wrench className="h-5 w-5 text-emerald-600" />}
        badge="قطعة غيار"
        category="قطع غيار"
        items={spareParts}
        loading={loading}
      />
      <ProductGridSection
        title="الإكسسوارات"
        icon={<Headphones className="h-5 w-5 text-fuchsia-600" />}
        badge="أكسسوارات"
        category="أكسسوارات"
        items={accessories}
        loading={loading}
      />
    </section>
  );
}
