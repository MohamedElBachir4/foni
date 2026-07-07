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
  detailHref?: string;
};

type ProductGridCardProps = {
  product: TieredProduct;
  effectivePrice: number;
  index?: number;
  priority?: boolean;
  imageSizes?: string;
  className?: string;
  /** نسخة مضغوطة لكاروسيل الجوال */
  compact?: boolean;
};

export function ProductGridCard({
  product,
  effectivePrice,
  index = 0,
  priority = false,
  imageSizes = "(max-width: 640px) 78vw, 25vw",
  className = "",
  compact = false,
}: ProductGridCardProps) {
  return (
    <div
      className={`group flex h-full flex-col overflow-hidden border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition-all duration-500 ${
        compact
          ? "min-h-[318px] rounded-2xl"
          : "min-h-[372px] rounded-3xl sm:min-h-[402px]"
      } ${className}`}
    >
      <div
        className={`relative flex shrink-0 items-center justify-center bg-gradient-to-b from-slate-50 via-white to-blue-50/40 ${
          compact
            ? "h-[136px] px-3 pb-2 pt-4"
            : "h-[162px] px-4 pb-2.5 pt-5 sm:h-[190px] sm:px-5 sm:pb-3 sm:pt-5"
        }`}
      >
        <ProductImage
          src={product.image}
          alt={product.name}
          priority={priority || index === 0}
          sizes={imageSizes}
          className={`h-full w-full object-contain drop-shadow-[0_12px_22px_rgba(15,23,42,0.24)] ${
            compact ? "rounded-xl p-1.5" : "rounded-2xl p-2 sm:p-3"
          }`}
        />
        <span
          className={`absolute start-3 top-3 rounded-full bg-blue-600 font-bold text-white shadow ${
            compact ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px] sm:start-4 sm:top-4 sm:px-3 sm:text-xs"
          }`}
        >
          {product.category}
        </span>
        <button
          type="button"
          aria-label="إضافة للمفضلة"
          className={`absolute end-3 top-3 rounded-full border border-slate-200/60 bg-white/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-red-500 ${
            compact ? "p-1" : "p-1.5 sm:end-4 sm:top-4 sm:p-2"
          }`}
        >
          <Heart className={`text-slate-500 ${compact ? "h-3.5 w-3.5" : "h-4 w-4 sm:h-5 sm:w-5"}`} strokeWidth={1.5} />
        </button>
      </div>

      <div className={`flex min-h-0 flex-1 flex-col border-t border-slate-100 ${compact ? "p-3" : "p-4"}`}>
        <h3
          className={`mb-1.5 break-words text-center font-extrabold leading-snug text-slate-900 ${
            compact ? "text-xs line-clamp-2" : "mb-2 text-sm sm:line-clamp-2 sm:min-h-[2.75rem] sm:text-base"
          }`}
        >
          {product.name}
        </h3>

        {effectivePrice > 0 ? (
          <p className={`text-center ${compact ? "mb-1.5" : "mb-2"}`}>
            <span
              className={`font-black tracking-tight text-blue-700 ${
                compact ? "text-xl" : "text-2xl sm:text-[1.75rem]"
              }`}
            >
              {formatDzd(effectivePrice)}
            </span>
            <span className={`mr-1 font-semibold text-slate-500 ${compact ? "text-xs" : "text-sm"}`}>DA</span>
          </p>
        ) : (
          <p className={`text-center font-semibold text-slate-400 ${compact ? "mb-1.5 text-xs" : "mb-2 min-h-[1.5rem] text-sm"}`}>
            — DA
          </p>
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
          detailHref={product.detailHref}
        />
      </div>
    </div>
  );
}
