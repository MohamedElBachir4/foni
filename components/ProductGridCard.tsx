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
  imageSizes = "(max-width: 640px) 48vw, 25vw",
  className = "",
  compact = false,
}: ProductGridCardProps) {
  return (
    <div
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md ${
        compact ? "min-h-[260px]" : "min-h-[300px] sm:min-h-[360px]"
      } ${className}`}
    >
      {/* صورة المنتج */}
      <div
        className={`relative flex shrink-0 items-center justify-center bg-slate-50 ${
          compact
            ? "h-[130px] px-3 pb-2 pt-3"
            : "h-[150px] px-3 pb-2 pt-4 sm:h-[190px] sm:px-4 sm:pb-3 sm:pt-5"
        }`}
      >
        <ProductImage
          src={product.image}
          alt={product.name}
          priority={priority || index === 0}
          sizes={imageSizes}
          className="h-full w-full object-contain"
        />
        {/* بادج التصنيف */}
        <span
          className={`absolute start-2 top-2 rounded-full bg-blue-600 font-semibold text-white ${
            compact ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-0.5 text-[9px] sm:text-[10px]"
          }`}
        >
          {product.category}
        </span>
        {/* زر المفضلة */}
        <button
          type="button"
          aria-label="إضافة للمفضلة"
          className={`absolute end-2 top-2 rounded-full bg-white/90 shadow-sm transition hover:text-red-500 ${
            compact ? "p-1" : "p-1.5"
          }`}
        >
          <Heart className={`text-slate-400 ${compact ? "h-3 w-3" : "h-3.5 w-3.5 sm:h-4 sm:w-4"}`} strokeWidth={1.5} />
        </button>
      </div>

      {/* تفاصيل المنتج */}
      <div className={`flex flex-1 flex-col border-t border-slate-50 ${compact ? "p-2.5" : "p-3 sm:p-4"}`}>
        {/* اسم المنتج */}
        <h3
          className={`mb-1 line-clamp-2 text-center font-bold leading-snug text-slate-800 ${
            compact ? "text-[11px]" : "text-xs sm:text-sm"
          }`}
        >
          {product.name}
        </h3>

        {/* السعر */}
        {effectivePrice > 0 ? (
          <p className={`text-center ${compact ? "mb-2" : "mb-2 sm:mb-3"}`}>
            <span
              className={`font-black text-blue-600 ${
                compact ? "text-base" : "text-lg sm:text-xl"
              }`}
            >
              {formatDzd(effectivePrice)}
            </span>
            <span className={`ms-0.5 font-medium text-slate-400 ${compact ? "text-[9px]" : "text-[10px] sm:text-xs"}`}>
              DA
            </span>
          </p>
        ) : (
          <p className={`text-center font-medium text-slate-300 ${compact ? "mb-2 text-[10px]" : "mb-2 text-xs sm:mb-3"}`}>
            — DA
          </p>
        )}

        {/* أزرار الإجراء */}
        <div className="mt-auto">
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
    </div>
  );
}
