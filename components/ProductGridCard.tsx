"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, Plus, Minus, Check } from "lucide-react";
import { type Product } from "@/lib/productsData";
import { ProductImage } from "@/components/ProductImage";
import { useCart } from "@/context/CartContext";
import { formatDzd } from "@/lib/pricing";
import { slugifyProductName } from "@/lib/seo";

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
  compact?: boolean;
  /** كتالوج بدون سعر/سلة (مثل أدوات الصيانة حالياً) — نفس شكل البطاقة */
  catalogOnly?: boolean;
  subtitle?: string;
};

function inferProductType(
  category?: string
): "phone" | "accessory" | "sparePart" | "maintenanceTool" {
  if (category === "قطع غيار") return "sparePart";
  if (category === "أكسسوارات" || category === "اكسسوارات") return "accessory";
  if (category === "أدوات الصيانة") return "maintenanceTool";
  return "phone";
}

export function ProductGridCard({
  product,
  effectivePrice,
  index = 0,
  priority = false,
  imageSizes = "(max-width: 640px) 48vw, 25vw",
  className = "",
  compact = false,
  catalogOnly = false,
  subtitle,
}: ProductGridCardProps) {
  const detailUrl =
    product.detailHref ||
    `/product/${product.id}/${slugifyProductName(product.name)}`;
  const pt = inferProductType(product.category);
  const { addToCart } = useCart();

  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleAdd = useCallback(() => {
    if (added) return;
    addToCart({
      id: String(product.id),
      name: product.name,
      price: effectivePrice,
      image: product.image,
      quantity: qty,
      priceRetail: product.priceRetail ?? product.price,
      priceWholesale: product.priceWholesale,
      priceReparateur: product.priceReparateur,
      productType: pt,
    });
    setAdded(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setAdded(false);
      setQty(1);
    }, 1500);
  }, [added, addToCart, product, effectivePrice, qty, pt]);

  return (
    <div
      className={`group flex h-full flex-col overflow-hidden rounded-2xl bg-white ${
        compact ? "" : ""
      } ${className}`}
      style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.08)" }}
    >
      {/* صورة المنتج */}
      <Link href={detailUrl} className="relative block shrink-0">
        <div
          className={`relative flex items-center justify-center overflow-hidden bg-slate-50 ${
            compact ? "h-[130px]" : "h-[160px] sm:h-[200px]"
          }`}
        >
          <ProductImage
            src={product.image}
            alt={product.name}
            priority={priority || index === 0}
            sizes={imageSizes}
            className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </Link>

      {/* اسم + سعر + أزرار */}
      <div className={`flex flex-1 flex-col ${compact ? "gap-1 px-2.5 pb-2.5 pt-2" : "gap-1.5 px-3 pb-3 pt-2.5"}`}>
        {/* اسم المنتج */}
        <Link href={detailUrl}>
          <h3
            className={`line-clamp-2 font-bold leading-snug text-slate-800 group-hover:text-blue-600 ${
              compact ? "text-[10px]" : "text-xs sm:text-sm"
            }`}
          >
            {product.name}
          </h3>
        </Link>

        {catalogOnly ? (
          <>
            {subtitle ? (
              <p
                className={`line-clamp-2 text-slate-500 ${
                  compact ? "text-[9px]" : "text-[10px] sm:text-xs"
                }`}
              >
                {subtitle}
              </p>
            ) : (
              <p className="text-xs text-slate-300">—</p>
            )}
            <Link
              href={detailUrl}
              className={`mt-auto flex items-center justify-center rounded-xl bg-blue-600 font-bold text-white transition hover:bg-blue-700 active:scale-[0.98] ${
                compact ? "h-8 text-[10px]" : "h-9 text-xs sm:h-10 sm:text-sm"
              }`}
            >
              عرض التفاصيل
            </Link>
          </>
        ) : (
          <>
            {/* السعر */}
            <p>
              {effectivePrice > 0 ? (
                <span className={`font-extrabold text-blue-600 ${compact ? "text-sm" : "text-base sm:text-lg"}`}>
                  {formatDzd(effectivePrice)}{" "}
                  <span className="text-[10px] font-medium text-slate-400">DZD</span>
                </span>
              ) : (
                <span className="text-xs text-slate-300">— DZD</span>
              )}
            </p>

            {/* شريط الكمية + سلة */}
            <div className="mt-auto flex items-center gap-1.5 pt-1">
              {/* أزرار الكمية */}
              <div className="flex flex-1 items-center justify-between rounded-xl border border-slate-200 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className={`flex items-center justify-center text-blue-600 transition hover:bg-blue-50 active:bg-blue-100 ${
                    compact
                      ? "h-8 w-8 rounded-r-xl"
                      : "h-9 w-9 rounded-r-xl sm:h-10 sm:w-10"
                  }`}
                  aria-label="تقليل الكمية"
                >
                  <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
                <span
                  className={`min-w-[1.5rem] text-center font-bold text-slate-800 select-none ${
                    compact ? "text-xs" : "text-sm"
                  }`}
                >
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className={`flex items-center justify-center text-blue-600 transition hover:bg-blue-50 active:bg-blue-100 ${
                    compact
                      ? "h-8 w-8 rounded-l-xl"
                      : "h-9 w-9 rounded-l-xl sm:h-10 sm:w-10"
                  }`}
                  aria-label="زيادة الكمية"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
              </div>

              {/* زر السلة */}
              <button
                type="button"
                onClick={handleAdd}
                disabled={added || effectivePrice <= 0}
                className={`flex shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                  compact ? "h-8 w-8" : "h-9 w-9 sm:h-10 sm:w-10"
                } ${
                  added
                    ? "bg-emerald-500 text-white"
                    : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                } disabled:opacity-50`}
                aria-label="إضافة للسلة"
              >
                {added ? (
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                ) : (
                  <ShoppingCart className="h-4 w-4" strokeWidth={2} />
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
