"use client";

import Link from "next/link";
import { getProductImageUrl } from "@/lib/productImage";
import { isAppleBrand, sortPhoneTypesForAppleIphone } from "@/lib/iphoneModelOrder";

export type IphoneModelItem = {
  _id: string;
  name: string;
  image?: string;
};

type Props = {
  brandParam: string;
  brandName?: string | null;
  models: IphoneModelItem[];
  ctaLabel: string;
} & (
  | { getHref: (m: IphoneModelItem) => string; onModelNavigate?: never }
  | { onModelNavigate: (m: IphoneModelItem) => void; getHref?: never }
);

/**
 * موديلات Apple: ترتيب العناصر المُحمَّلة فقط (لا يضيف بيانات).
 * باقي الماركات: ترتيب كما ورد من الـ API.
 * عرض: شبكة واحدة — البطاقات بجانب بعض.
 */
export function IphoneOrPlainModelGrid({ brandParam, brandName, models, ctaLabel, ...nav }: Props) {
  const getHref = "getHref" in nav && nav.getHref ? nav.getHref : undefined;
  const onModelNavigate = "onModelNavigate" in nav && nav.onModelNavigate ? nav.onModelNavigate : undefined;
  const apple = isAppleBrand(brandParam, brandName);
  const list = apple ? sortPhoneTypesForAppleIphone(models) : models;
  if (list.length === 0) {
    return null;
  }
  return (
    <PlainGrid
      models={list}
      getHref={getHref}
      onModelNavigate={onModelNavigate}
      ctaLabel={ctaLabel}
    />
  );
}

/** شبكة بطاقات الموديل بترتيب الـ API — للصفحة الرئيسية وغيرها */
export function ModelChoiceGrid({
  models,
  getHref,
  ctaLabel = "متابعة",
  className = "",
}: {
  models: IphoneModelItem[];
  getHref: (m: IphoneModelItem) => string;
  ctaLabel?: string;
  className?: string;
}) {
  if (models.length === 0) return null;
  return (
    <PlainGrid models={models} getHref={getHref} ctaLabel={ctaLabel} className={className} />
  );
}

const cardClassName =
  "group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-right shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:ring-1 hover:ring-slate-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:rounded-[1.25rem]";

function PlainGrid({
  models,
  getHref,
  onModelNavigate,
  ctaLabel,
  className = "",
}: {
  models: IphoneModelItem[];
  getHref?: (m: IphoneModelItem) => string;
  onModelNavigate?: (m: IphoneModelItem) => void;
  ctaLabel: string;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 ${className}`.trim()}>
      {models.map((m) => {
        const inner = (
          <>
            <div className="relative flex min-h-[140px] items-center justify-center bg-gradient-to-b from-slate-50/95 to-white px-4 py-8 sm:min-h-[160px]">
              {m.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getProductImageUrl(m.image)}
                  alt=""
                  className="max-h-[120px] w-full max-w-[120px] object-contain transition-transform duration-300 group-hover:scale-105 sm:max-h-[140px] sm:max-w-[140px]"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
                    />
                  </svg>
                </div>
              )}
              <span className="absolute start-3 top-3 rounded-lg bg-blue-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                موديل
              </span>
            </div>
            <div className="flex flex-1 flex-col border-t border-slate-100 p-4">
              <h3 className="mb-3 line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-slate-800 group-hover:text-blue-700" dir="auto">
                {m.name}
              </h3>
              <span className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors group-hover:bg-blue-700">
                {ctaLabel}
                <svg className="h-4 w-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </span>
            </div>
          </>
        );
        if (onModelNavigate) {
          return (
            <button
              key={m._id}
              type="button"
              onClick={() => onModelNavigate(m)}
              className={cardClassName + " cursor-pointer text-inherit"}
            >
              {inner}
            </button>
          );
        }
        return (
          <Link key={m._id} href={getHref ? getHref(m) : "#"} className={cardClassName}>
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
