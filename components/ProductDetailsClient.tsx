"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Truck, ShoppingCart, ClipboardList } from "lucide-react";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductColorSwatches } from "@/components/ProductColorSwatches";

export function ProductDetailsClient({
  product,
  description,
}: {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    colors?: string[];
    category?: string;
  };
  description: string;
}) {
  const list = Array.isArray(product.colors) ? product.colors : [];
  const [selectedColor, setSelectedColor] = useState<string>(list[0] || "");

  const productType =
    product.category === "قطع غيار" ? "sparePart" : product.category === "أكسسوارات" ? "accessory" : "phone";

  return (
    <>
      {list.length > 0 && (
        <div className="mb-4 sm:mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:mb-2.5 sm:text-sm">
            الألوان المتوفرة
          </h2>
          <ProductColorSwatches colorIds={list} value={selectedColor} onChange={setSelectedColor} size="md" />
        </div>
      )}

      <div className="mb-4 sm:mb-6">
        <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:mb-2 sm:text-sm">
          الوصف
        </h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 sm:text-base">{description}</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 sm:mb-6 sm:gap-3">
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 sm:gap-1.5 sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-xs">
          <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.5} />
          ضمان
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700 sm:gap-1.5 sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-xs">
          <Truck className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.5} />
          توصيل
        </span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
        <AddToCartButton
          id={product.id}
          name={product.name}
          price={product.price}
          image={product.image}
          colors={list}
          lockColorToSelection={list.length > 0}
          lockedColor={selectedColor}
          productType={productType}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-md active:scale-[0.98] sm:rounded-xl sm:bg-gradient-to-l sm:from-blue-600 sm:to-blue-500 sm:py-4 sm:shadow-lg sm:shadow-blue-500/30 sm:transition-all sm:duration-300 sm:hover:from-blue-500 sm:hover:to-blue-600 sm:hover:shadow-xl sm:hover:shadow-blue-500/40"
        >
          <ShoppingCart className="h-5 w-5" strokeWidth={2.5} />
          أضف للسلة
        </AddToCartButton>
        <Link
          href="/checkout"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white py-3.5 font-bold text-slate-700 active:scale-[0.98] sm:rounded-xl sm:py-4 sm:transition-all sm:duration-300 sm:hover:border-blue-400 sm:hover:bg-blue-50 sm:hover:text-blue-600"
        >
          <ClipboardList className="h-5 w-5" strokeWidth={2.5} />
          اطلب الآن
        </Link>
      </div>
    </>
  );
}
