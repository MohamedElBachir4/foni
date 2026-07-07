"use client";

import Link from "next/link";
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
  ctaLabel,
}: {
  model: CarouselModel;
  className: string;
  ctaLabel: string;
}) {
  return (
    <Link
      href={model.href}
      className={`group flex h-full min-h-[318px] w-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-right shadow-sm ${className}`}
    >
      <div className="relative flex min-h-[136px] shrink-0 items-center justify-center bg-gradient-to-b from-slate-50/95 to-white px-3 py-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getProductImageUrl(model.image, { size: "thumb" })}
          alt=""
          className="max-h-[110px] w-full max-w-[110px] object-contain transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <span className="absolute start-3 top-3 rounded-lg bg-blue-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
          موديل
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col border-t border-slate-100 p-3">
        <h3
          className="mb-2 line-clamp-2 min-h-[2.25rem] text-center text-xs font-bold leading-snug text-slate-800 group-hover:text-blue-700"
          dir="auto"
        >
          {model.name}
        </h3>
        <span className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors group-hover:bg-blue-700">
          {ctaLabel}
          <svg
            className="h-3.5 w-3.5 rtl:rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </span>
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
