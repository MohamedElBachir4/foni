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
import { getEffectivePrice, formatDzd } from "@/lib/pricing";
import { highlightQueryInText } from "@/lib/highlightSearch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
};

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
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const u = new URLSearchParams();
        u.set("q", query.trim());
        u.set("limit", "24");
        if (sectionApi) u.set("section", sectionApi);
        const res = await fetch(`${API_URL}/api/search?${u.toString()}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === "object" && Array.isArray(data.phones)) {
            setGrouped(data as Grouped);
          } else {
            setGrouped({ phones: [], spareParts: [], accessories: [] });
          }
        } else {
          setGrouped({ phones: [], spareParts: [], accessories: [] });
        }
      } catch {
        setGrouped({ phones: [], spareParts: [], accessories: [] });
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
    if (sectionApi === "phones") return grouped.phones;
    if (sectionApi === "spareParts") return grouped.spareParts;
    if (sectionApi === "accessories") return grouped.accessories;
    return [];
  }, [grouped, sectionApi]);

  const hasAny =
    grouped &&
    (grouped.phones.length > 0 || grouped.spareParts.length > 0 || grouped.accessories.length > 0);

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
          <ResultGrid
            q={q}
            items={listForSection}
            account={account}
            categoryLabel={categoryLabel}
          />
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
                    q={q}
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
  q,
  items,
  account,
  categoryLabel,
}: {
  q: string;
  items: SearchResult[];
  account: AccountInfo | null;
  categoryLabel: (t: string) => string;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2 lg:grid-cols-4">
      {items.map((item) => {
        const effectivePrice = getEffectivePrice(
          {
            price: item.price,
            priceRetail: item.priceRetail,
            priceWholesale: item.priceWholesale,
            priceReparateur: item.priceReparateur,
          },
          account
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
                {highlightQueryInText(item.name, q)}
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
                  item.type === "phone" || item.type === "phoneType" ? "هواتف" : undefined
                }
              />
            </div>
          </div>
        );
      })}
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
