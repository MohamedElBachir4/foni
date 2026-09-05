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
  "group flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white text-right transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2";

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
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 ${className}`.trim()}>
      {models.map((m) => {
        const inner = (
          <>
            <div className="relative flex h-[150px] shrink-0 items-center justify-center overflow-hidden bg-slate-50 px-3 py-3 sm:h-[190px] sm:px-4 sm:py-4">
              {m.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getProductImageUrl(m.image, { size: "medium" })}
                  alt={m.name}
                  className="mx-auto block max-h-full max-w-full object-contain object-center transition-transform duration-300 group-hover:scale-[1.04]"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-2 border-t border-slate-100 px-3 pb-3 pt-2.5">
              <h3
                className="line-clamp-2 text-center text-xs font-bold leading-snug text-slate-800 group-hover:text-blue-600 sm:text-sm"
                dir="auto"
              >
                {m.name}
              </h3>
              <span className="mt-auto inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-[11px] font-bold text-white transition-colors group-hover:bg-blue-700 sm:py-2.5 sm:text-xs">
                {ctaLabel}
                <svg className="h-3.5 w-3.5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
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
              style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.08)" }}
            >
              {inner}
            </button>
          );
        }
        return (
          <Link
            key={m._id}
            href={getHref ? getHref(m) : "#"}
            className={cardClassName}
            style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.08)" }}
          >
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
