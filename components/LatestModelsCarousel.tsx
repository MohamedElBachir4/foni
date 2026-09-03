"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProductImageUrl } from "@/lib/productImage";
import {
  ProductPeekCarousel,
  type TieredProduct,
} from "@/components/ProductPeekCarousel";
import type { IphoneModelItem } from "@/components/brand/IphoneModelSections";

export type LatestModelItem = IphoneModelItem & { href: string };

type LatestModelsCarouselProps = {
  models: LatestModelItem[];
  ctaLabel?: string;
};

type CarouselModel = TieredProduct & { href: string };

function ModelPeekCard({
  model,
  className,
}: {
  model: CarouselModel;
  className: string;
  ctaLabel: string;
}) {
  return (
    <Link
      href={model.href}
      className={`group flex w-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white transition-all duration-300 ${className}`}
    >
      {/* منطقة الصورة — ارتفاع ثابت مع object-contain لضمان الصورة كاملة */}
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getProductImageUrl(model.image, { size: "medium" })}
          alt={model.name}
          className="absolute inset-0 h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.04]"
          loading="lazy"
          decoding="async"
        />
        {/* بادج */}
        <span className="absolute left-2 top-2 rounded-full bg-blue-600 px-2 py-0.5 text-[8px] font-bold text-white">
          جديد
        </span>
      </div>

      {/* اسم + زر */}
      <div className="flex flex-col gap-2 border-t border-slate-100 px-3 pb-3 pt-2.5">
        <h3
          className="line-clamp-2 text-center text-[11px] font-bold leading-snug text-slate-800 group-hover:text-blue-600"
          dir="auto"
        >
          {model.name}
        </h3>
        <div className="flex items-center justify-center gap-1 rounded-xl bg-blue-600 py-2 text-[10px] font-bold text-white transition-colors group-hover:bg-blue-700">
          <span>عرض</span>
          <ArrowLeft className="h-3 w-3 rtl:rotate-180" />
        </div>
      </div>
    </Link>
  );
}

export function LatestModelsCarousel({ models, ctaLabel = "متابعة" }: LatestModelsCarouselProps) {
  const products: CarouselModel[] = models
    .filter((m) => m.href)
    .map((m) => ({
      id: m._id,
      name: m.name,
      image: m.image || "",
      price: 0,
      brand: "",
      category: "موديل",
      href: m.href,
    }));

  if (!products.length) return null;

  return (
    <ProductPeekCarousel
      className="sm:hidden"
      products={products}
      pricingAccount={null}
      variant="latest"
      sectionLabel="أحدث المنتجات"
      ariaLabel="أحدث المنتجات"
      renderCard={(product, { className }) => (
        <ModelPeekCard
          model={product as CarouselModel}
          className={className}
          ctaLabel={ctaLabel}
        />
      )}
    />
  );
}
