"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductImage } from "@/components/ProductImage";
import { Heart, Search } from "lucide-react";
import { ProductCardActions } from "@/components/ProductCardActions";
import { useAccount, type AccountInfo } from "@/context/AccountContext";
import { getEffectivePrice, formatDzd, getPricingAccount } from "@/lib/pricing";
import { highlightQueryInText } from "@/lib/highlightSearch";
import { publicFetch } from "@/lib/publicFetch";

type SearchResult = {
  type: string;
  _id: string;
  name: string;
  price: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
  image: string;
  href: string;
};

type Grouped = {
  phones: SearchResult[];
  spareParts: SearchResult[];
  accessories: SearchResult[];
  interpretedQuery?: string;
};

function collapseForCompare(s: string) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function categoryLabel(type: string) {
  if (type === "phone") return "هاتف";
  if (type === "phoneType") return "موديل";
  if (type === "accessory") return "أكسسوار";
  if (type === "sparePart") return "قطعة غيار";
  return "";
}

function sectionTitle(key: "phones" | "spareParts" | "accessories") {
  if (key === "phones") return "الهواتف والموديلات";
  if (key === "spareParts") return "قطع الغيار";
  return "الإكسسوارات";
}

function SearchBody() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const section = searchParams.get("section") || "";
  const [grouped, setGrouped] = useState<Grouped | null>(null);
  const [loading, setLoading] = useState(true);
  const [interpretedQuery, setInterpretedQuery] = useState<string>("");
  const { account } = useAccount();

  const sectionApi =
    section === "phones" || section === "accessories" || section === "spare-parts" || section === "spareparts"
      ? section === "spare-parts" || section === "spareparts"
        ? "spareParts"
        : section
      : "";

  const fetchResults = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setGrouped({ phones: [], spareParts: [], accessories: [] });
        setInterpretedQuery("");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const u = new URLSearchParams();
        u.set("q", query.trim());
        u.set("limit", "50");
        if (sectionApi) u.set("section", sectionApi);
        const res = await publicFetch(`/api/search?${u.toString()}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === "object" && Array.isArray(data.phones)) {
            const iq =
              typeof data.interpretedQuery === "string" ? data.interpretedQuery.trim() : "";
            setInterpretedQuery(iq);
            setGrouped(data as Grouped);
          } else {
            setGrouped({ phones: [], spareParts: [], accessories: [] });
            setInterpretedQuery("");
          }
        } else {
          setGrouped({ phones: [], spareParts: [], accessories: [] });
          setInterpretedQuery("");
        }
      } catch {
        setGrouped({ phones: [], spareParts: [], accessories: [] });
        setInterpretedQuery("");
      } finally {
        setLoading(false);
      }
    },
    [sectionApi]
  );

  useEffect(() => {
    fetchResults(q);
  }, [q, fetchResults]);

  const listForSection = useMemo(() => {
    if (!grouped) return [];
    if (sectionApi === "phones") {
      // في قسم الهواتف نعرض "بطاقات الموديل" فقط — لا نعرض منتجات الهاتف هنا.
      return grouped.phones.filter((x) => x.type === "phoneType");
    }
    if (sectionApi === "spareParts") return grouped.spareParts;
    if (sectionApi === "accessories") return grouped.accessories;
    return [];
  }, [grouped, sectionApi]);

  const hasAny =
    grouped &&
    (grouped.phones.length > 0 || grouped.spareParts.length > 0 || grouped.accessories.length > 0);

  const highlightSource = useMemo(() => {
    const raw = q.trim();
    if (
      interpretedQuery &&
      collapseForCompare(interpretedQuery) !== collapseForCompare(raw)
    ) {
      return interpretedQuery;
    }
    return raw;
  }, [interpretedQuery, q]);

  const showInterpretedLine =
    Boolean(q.trim()) &&
    Boolean(interpretedQuery) &&
    collapseForCompare(interpretedQuery) !== collapseForCompare(q.trim());

  return (
    <div className="min-h-screen w-full bg-slate-50 antialiased">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-32 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:mb-10">
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold text-slate-800 sm:text-3xl">
            <span className="flex h-8 w-1.5 rounded-full bg-gradient-to-b from-blue-600 to-blue-400" />
            نتائج البحث
            {q && (
              <span className="text-slate-500 font-normal">&quot;{q}&quot;</span>
            )}
          </h1>
          {q.trim() && (
            <p className="text-sm text-slate-600">
              {showInterpretedLine ? (
                <span className="mr-3 inline-block leading-relaxed">
                  <span className="font-semibold text-slate-700">بحث بتفسير المرونة: </span>
                  <Link
                    href={`/search?q=${encodeURIComponent(interpretedQuery)}`}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    {interpretedQuery}
                  </Link>
                  <span className="mx-2 text-slate-400">·</span>
                </span>
              ) : null}
              <Link
                href={`/search/categories?q=${encodeURIComponent(q)}`}
                className="font-semibold text-blue-600 hover:underline"
              >
                تصفّح حسب القسم
              </Link>
            </p>
          )}
          {!q.trim() && <p className="text-gray-600">أدخل كلمة في شريط البحث أعلاه.</p>}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <span>جاري البحث...</span>
          </div>
        ) : !hasAny ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Search className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-slate-600">
              {q.trim() ? "لا توجد نتائج مطابقة." : "لم يتم إدخال كلمة بحث."}
            </p>
          </div>
        ) : sectionApi && grouped ? (
          sectionApi === "phones" ? (
            <PhoneModelGrid
              highlightQuery={highlightSource}
              items={listForSection}
            />
          ) : (
            <ResultGrid
              highlightQuery={highlightSource}
              items={listForSection}
              account={account}
              categoryLabel={categoryLabel}
            />
          )
        ) : grouped ? (
          <div className="space-y-12">
            {(["phones", "spareParts", "accessories"] as const).map((key) => {
              const list = grouped[key];
              if (!list.length) return null;
              return (
                <section key={key} id={key} className="scroll-mt-24">
                  <h2 className="mb-4 border-b border-slate-200 pb-2 text-lg font-bold text-slate-800">
                    {sectionTitle(key)}
                  </h2>
                  <ResultGrid
                    highlightQuery={highlightSource}
                    items={list}
                    account={account}
                    categoryLabel={categoryLabel}
                  />
                </section>
              );
            })}
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}

function ResultGrid({
  highlightQuery,
  items,
  account,
  categoryLabel,
}: {
  highlightQuery: string;
  items: SearchResult[];
  account: AccountInfo | null;
  categoryLabel: (t: string) => string;
}) {
  const pricingAccount = useMemo(() => getPricingAccount(account), [account]);

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2 lg:grid-cols-4">
      <Link
        href="/request-part"
        className="group flex h-full min-h-[340px] flex-col justify-center rounded-2xl border border-dashed border-amber-300 bg-gradient-to-b from-amber-50 to-white p-5 text-center shadow-sm transition hover:border-amber-400 hover:shadow-md sm:min-h-[360px] sm:rounded-[1.25rem]"
      >
        <p className="text-sm font-bold text-amber-700 sm:text-base">لم تجد قطعتك؟</p>
        <p className="mt-2 text-xs text-slate-600 sm:text-sm">
          أرسل طلب قطعة جديدة وسنتواصل معك.
        </p>
        <span className="mt-4 inline-flex items-center justify-center rounded-full bg-amber-500 px-4 py-2 text-xs font-bold text-white transition group-hover:bg-amber-600">
          طلب قطعة
        </span>
      </Link>
      {items.map((item) => {
        const effectivePrice = getEffectivePrice(
          {
            price: item.price,
            priceRetail: item.priceRetail,
            priceWholesale: item.priceWholesale,
            priceReparateur: item.priceReparateur,
          },
          pricingAccount
        );
        return (
          <div
            key={`${item.type}-${item._id}`}
            className="group flex h-full min-h-[340px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 hover:border-slate-200 hover:shadow-xl sm:min-h-[360px] sm:rounded-[1.25rem]"
          >
            <div className="relative flex h-[120px] shrink-0 items-center justify-center bg-gradient-to-b from-slate-50 to-white px-3 py-3 sm:h-[130px]">
              <ProductImage
                src={item.image}
                alt={item.name}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="h-full w-full max-w-[100px] object-contain sm:max-w-[130px]"
              />
              <span className="absolute start-3 top-3 rounded-lg bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm sm:start-4 sm:top-4 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs">
                {categoryLabel(item.type)}
              </span>
              <button
                type="button"
                aria-label="إضافة للمفضلة"
                className="absolute end-3 top-3 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-red-500 sm:end-4 sm:top-4 sm:p-2"
              >
                <Heart className="h-4 w-4 text-slate-500 sm:h-5 sm:w-5" strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col border-t border-slate-100 p-3">
              <h3 className="mb-1.5 min-h-[2.5rem] text-center text-sm font-bold leading-snug text-slate-900 line-clamp-2 sm:text-base">
                {highlightQueryInText(item.name, highlightQuery)}
              </h3>

              {effectivePrice != null && Number(effectivePrice) > 0 ? (
                <p className="mb-1.5 text-center">
                  <span className="text-xl font-black text-slate-900 sm:text-2xl">
                    {formatDzd(effectivePrice)}
                  </span>
                  <span className="mr-1 text-sm font-semibold text-slate-500">DA</span>
                </p>
              ) : (
                <p className="mb-1.5 min-h-[1.5rem] text-center text-sm font-semibold text-slate-400">
                  — DA
                </p>
              )}

              <div className="mb-2 min-h-[28px]" />

              <ProductCardActions
                id={item._id}
                name={item.name}
                price={effectivePrice}
                image={item.image}
                colors={(item as { colors?: string[] }).colors}
                category={
                  item.type === "phone" || item.type === "phoneType"
                    ? "هواتف"
                    : item.type === "sparePart"
                      ? "قطع غيار"
                      : item.type === "accessory"
                        ? "أكسسوارات"
                        : "هواتف"
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PhoneModelGrid({
  highlightQuery,
  items,
}: {
  highlightQuery: string;
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
              {highlightQueryInText(item.name, highlightQuery)}
            </h3>
            <span className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors group-hover:bg-blue-700">
              عرض قطع الغيار
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
