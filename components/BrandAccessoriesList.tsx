"use client";

import { ProductImage } from "@/components/ProductImage";
import { Heart } from "lucide-react";
import { ProductCardActions } from "@/components/ProductCardActions";
import { useAccount } from "@/context/AccountContext";
import { getEffectivePrice, formatDzd } from "@/lib/pricing";

type Accessory = {
  _id: string;
  name: string;
  image?: string;
  price?: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
  details?: string;
  colors?: string[];
};

export function BrandAccessoriesList({ accessories }: { accessories: Accessory[] }) {
  const { account } = useAccount();
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
          account
        );
        return (
          <article
            key={a._id}
            className="group flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl sm:rounded-[1.25rem]"
          >
            <div className="relative flex min-h-[120px] shrink-0 items-center justify-center bg-gradient-to-b from-slate-50 to-white px-3 py-3 sm:min-h-[130px] sm:py-4">
              <ProductImage
                src={
                  a.image ||
                  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80"
                }
                alt={a.name}
                priority={false}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="w-full max-w-[100px] object-contain sm:max-w-[130px]"
              />
              <span className="absolute start-3 top-3 rounded-lg bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm sm:start-4 sm:top-4 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs">
                أكسسوارات
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
              <h2 className="mb-2 line-clamp-2 text-center text-sm font-bold leading-snug text-slate-900 sm:text-base">
                {a.name}
              </h2>

              <p className="mb-2 line-clamp-2 text-center text-xs text-slate-500 sm:text-sm">
                {a.details || "أكسسوار متوفر للطلب."}
              </p>

              {effectivePrice != null && effectivePrice > 0 ? (
                <p className="mb-2 text-center">
                  <span className="text-xl font-black text-slate-900 sm:text-2xl">
                    {formatDzd(effectivePrice)}
                  </span>
                  <span className="mr-1 text-sm font-semibold text-slate-500">DA</span>
                </p>
              ) : (
                <p className="mb-2 text-center text-sm font-semibold text-slate-400">— DA</p>
              )}

              <ProductCardActions
                id={a._id}
                name={a.name}
                price={effectivePrice ?? 0}
                image={a.image ?? ""}
                colors={Array.isArray(a.colors) ? a.colors : []}
                category="أكسسوارات"
              />
            </div>
          </article>
        );
      })}
    </section>
  );
}
