"use client";

import { Heart } from "lucide-react";
import { type Product } from "@/lib/productsData";
import { ProductImage } from "@/components/ProductImage";
import { ProductCardActions } from "@/components/ProductCardActions";
import { formatDzd } from "@/lib/pricing";

type TieredProduct = Product & {
  colors?: string[];
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
};

type ProductGridCardProps = {
  product: TieredProduct;
  effectivePrice: number;
  index?: number;
  priority?: boolean;
  imageSizes?: string;
  className?: string;
};

export function ProductGridCard({
  product,
  effectivePrice,
  index = 0,
  priority = false,
  imageSizes = "(max-width: 640px) 78vw, 25vw",
  className = "",
}: ProductGridCardProps) {
  return (
    <div
      className={`group flex h-full min-h-[372px] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition-all duration-500 sm:min-h-[402px] ${className}`}
    >
      <div className="relative flex h-[162px] shrink-0 items-center justify-center bg-gradient-to-b from-slate-50 via-white to-blue-50/40 px-4 pb-2.5 pt-5 sm:h-[190px] sm:px-5 sm:pb-3 sm:pt-5">
        <ProductImage
          src={product.image}
          alt={product.name}
          priority={priority || index < 4}
          sizes={imageSizes}
          className="h-full w-full rounded-2xl object-contain p-2 drop-shadow-[0_12px_22px_rgba(15,23,42,0.24)] sm:p-3"
        />
        <span className="absolute start-3 top-3 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white shadow sm:start-4 sm:top-4 sm:px-3 sm:text-xs">
          {product.category}
        </span>
        <button
          type="button"
          aria-label="إضافة للمفضلة"
          className="absolute end-3 top-3 rounded-full border border-slate-200/60 bg-white/90 p-1.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-red-500 sm:end-4 sm:top-4 sm:p-2"
        >
          <Heart className="h-4 w-4 text-slate-500 sm:h-5 sm:w-5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col border-t border-slate-100 p-4">
        <h3 className="mb-2 break-words text-center text-sm font-extrabold leading-snug text-slate-900 sm:line-clamp-2 sm:min-h-[2.75rem] sm:text-base">
          {product.name}
        </h3>

        {effectivePrice > 0 ? (
          <p className="mb-2 text-center">
            <span className="text-2xl font-black tracking-tight text-blue-700 sm:text-[1.75rem]">
              {formatDzd(effectivePrice)}
            </span>
            <span className="mr-1 text-sm font-semibold text-slate-500">DA</span>
          </p>
        ) : (
          <p className="mb-2 min-h-[1.5rem] text-center text-sm font-semibold text-slate-400">— DA</p>
        )}

        <ProductCardActions
          id={String(product.id)}
          name={product.name}
          price={effectivePrice}
          priceRetail={product.priceRetail ?? product.price}
          priceWholesale={product.priceWholesale}
          priceReparateur={product.priceReparateur}
          image={product.image}
          colors={Array.isArray(product.colors) ? product.colors : undefined}
          category={product.category}
        />
      </div>
    </div>
  );
}
