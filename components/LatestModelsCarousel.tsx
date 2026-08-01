"use client";

import Link from "next/link";
import { getProductImageUrl } from "@/lib/productImage";
import type { IphoneModelItem } from "@/components/brand/IphoneModelSections";

export type LatestModelItem = IphoneModelItem & { href: string };

type LatestModelsCarouselProps = {
  models: LatestModelItem[];
  ctaLabel?: string;
};

function ModelStaticCard({
  model,
  ctaLabel,
}: {
  model: LatestModelItem;
  ctaLabel: string;
}) {
  return (
    <Link
      href={model.href}
      className="group flex h-full min-h-[280px] w-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-right shadow-sm"
    >
      <div className="relative flex min-h-[120px] shrink-0 items-center justify-center bg-gradient-to-b from-slate-50/95 to-white px-3 py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getProductImageUrl(model.image, { size: "thumb" })}
          alt=""
          className="max-h-[100px] w-full max-w-[100px] object-contain"
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

/** TEMP: static mobile list — replaces ProductPeekCarousel (no rAF / setInterval / motion). */
export function LatestModelsCarousel({ models, ctaLabel = "متابعة" }: LatestModelsCarouselProps) {
  const items = models.filter((m) => m.href);
  if (!items.length) return null;

  return (
    <div className="-mx-4 grid grid-cols-2 gap-3 px-2 sm:hidden" aria-label="أحدث المنتجات">
      {items.map((model) => (
        <ModelStaticCard key={model._id} model={model} ctaLabel={ctaLabel} />
      ))}
    </div>
  );
}
