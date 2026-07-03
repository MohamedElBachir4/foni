"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductImage } from "@/components/ProductImage";
import { Search } from "lucide-react";
import { highlightTokensInText } from "@/lib/highlightSearch";
import { useSearchSuggestions } from "@/lib/useSearch";

type SearchResult = {
  type: string;
  _id: string;
  name: string;
  image: string;
  href: string;
};

function collapseForCompare(s: string) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function SearchBody() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";

  const {
    grouped,
    interpretedQuery,
    matchedTokens,
    loading,
    error: fetchError,
    refetch,
  } = useSearchSuggestions(q, { limit: 50 });

  const highlightTokens =
    matchedTokens.length > 0
      ? matchedTokens
      : interpretedQuery && collapseForCompare(interpretedQuery) !== collapseForCompare(q.trim())
        ? interpretedQuery.split(/\s+/).filter(Boolean)
        : q.trim().split(/\s+/).filter(Boolean);

  const models = useMemo(() => grouped?.phones ?? [], [grouped]);

  const hasAny = models.length > 0;

  const showInterpretedLine =
    Boolean(q.trim()) &&
    Boolean(interpretedQuery) &&
    collapseForCompare(interpretedQuery || "") !== collapseForCompare(q.trim());

  return (
    <div className="min-h-screen w-full bg-slate-50 antialiased">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-32 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:mb-10">
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold text-slate-800 sm:text-3xl">
            <span className="flex h-8 w-1.5 rounded-full bg-gradient-to-b from-blue-600 to-blue-400" />
            نتائج البحث
            {q && (
              <span className="font-normal text-slate-500">&quot;{q}&quot;</span>
            )}
          </h1>
          {q.trim() && showInterpretedLine ? (
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-700">بحث بتفسير المرونة: </span>
              <Link
                href={`/search?q=${encodeURIComponent(interpretedQuery)}`}
                className="font-semibold text-blue-600 hover:underline"
              >
                {interpretedQuery}
              </Link>
            </p>
          ) : null}
          {!q.trim() && <p className="text-gray-600">أدخل كلمة في شريط البحث أعلاه.</p>}
          {q.trim() ? (
            <p className="text-sm text-slate-500">اختر موديل الهاتف لعرض منتجاته (هواتف، قطع غيار، أكسسوارات).</p>
          ) : null}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <span>جاري البحث...</span>
          </div>
        ) : fetchError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-12 text-center shadow-sm">
            <p className="text-slate-700">{fetchError}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : !hasAny ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Search className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-slate-600">
              {q.trim() ? "لا توجد موديلات مطابقة." : "لم يتم إدخال كلمة بحث."}
            </p>
          </div>
        ) : (
          <PhoneModelGrid highlightTokens={highlightTokens} items={models} />
        )}
      </main>
      <Footer />
    </div>
  );
}

function PhoneModelGrid({
  highlightTokens,
  items,
}: {
  highlightTokens: string[];
  items: SearchResult[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <Link
          key={`${item.type}-${item._id}`}
          href={item.href}
          className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-right shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:ring-1 hover:ring-slate-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:rounded-[1.25rem]"
        >
          <div className="relative flex min-h-[140px] items-center justify-center bg-gradient-to-b from-slate-50/95 to-white px-4 py-8 sm:min-h-[160px]">
            <ProductImage
              src={item.image}
              alt={item.name}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="max-h-[120px] w-full max-w-[120px] object-contain transition-transform duration-300 group-hover:scale-105 sm:max-h-[140px] sm:max-w-[140px]"
            />
            <span className="absolute start-3 top-3 rounded-lg bg-blue-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              موديل
            </span>
          </div>
          <div className="flex flex-1 flex-col border-t border-slate-100 p-4">
            <h3
              className="mb-3 line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-slate-800 group-hover:text-blue-700"
              dir="auto"
            >
              {highlightTokensInText(item.name, highlightTokens)}
            </h3>
            <span className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors group-hover:bg-blue-700">
              متابعة
              <svg
                className="h-4 w-4 rtl:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function SearchViewFallback() {
  return (
    <div className="min-h-screen w-full bg-slate-50 antialiased">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-32 lg:px-8">
        <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span>جاري التحميل...</span>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function SearchView() {
  return (
    <Suspense fallback={<SearchViewFallback />}>
      <SearchBody />
    </Suspense>
  );
}
