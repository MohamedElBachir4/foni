"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductImage } from "@/components/ProductImage";
import { Heart, Search, ShoppingCart } from "lucide-react";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductCardActions } from "@/components/ProductCardActions";
import { useAccount } from "@/context/AccountContext";
import { getEffectivePrice } from "@/lib/pricing";

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

function categoryLabel(type: string) {
  if (type === "phone") return "هاتف";
  if (type === "accessory") return "أكسسوار";
  if (type === "sparePart") return "قطعة غيار";
  return "";
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { account } = useAccount();

  const fetchResults = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/search?q=${encodeURIComponent(query.trim())}&limit=50`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults(q);
  }, [q, fetchResults]);

  return (
    <div className="min-h-screen w-full bg-slate-50 antialiased">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-32 lg:px-8">
        <div className="mb-8 flex flex-col gap-2 sm:mb-10">
          <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-800 sm:text-3xl">
            <span className="flex h-8 w-1.5 rounded-full bg-gradient-to-b from-blue-600 to-blue-400" />
            نتائج البحث
            {q && (
              <span className="text-slate-500 font-normal">
                &quot;{q}&quot;
              </span>
            )}
          </h1>
          {!q.trim() && (
            <p className="text-gray-600">أدخل كلمة في شريط البحث أعلاه.</p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
            <Search className="h-6 w-6 animate-pulse" />
            <span>جاري البحث...</span>
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Search className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-slate-600">
              {q.trim() ? "لا توجد نتائج مطابقة." : "لم يتم إدخال كلمة بحث."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2 lg:grid-cols-4">
            {results.map((item) => {
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
                  className="group flex h-full min-h-[340px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 hover:shadow-xl hover:border-slate-200 sm:min-h-[360px] sm:rounded-[1.25rem]"
                >
                  <div className="relative flex h-[120px] shrink-0 items-center justify-center bg-gradient-to-b from-slate-50 to-white px-3 py-3 sm:h-[130px]">
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-contain w-full max-w-[100px] sm:max-w-[130px]"
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
                      {item.name}
                    </h3>

                    {effectivePrice != null && Number(effectivePrice) > 0 ? (
                      <p className="mb-1.5 text-center">
                        <span className="text-xl font-black text-slate-900 sm:text-2xl">
                          {Number(effectivePrice).toLocaleString()}
                        </span>
                        <span className="mr-1 text-sm font-semibold text-slate-500">دج</span>
                      </p>
                    ) : (
                      <p className="mb-1.5 min-h-[1.5rem] text-center text-sm font-semibold text-slate-400">— دج</p>
                    )}

                    <div className="mb-2 min-h-[28px]" />

                    <ProductCardActions
                      id={item._id}
                      name={item.name}
                      price={effectivePrice}
                      image={item.image}
                      colors={(item as any).colors}
                      category={item.type === "phone" ? "هواتف" : undefined}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function SearchPageFallback() {
  return (
    <div className="min-h-screen w-full bg-slate-50 antialiased">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-32 lg:px-8">
        <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
          <Search className="h-6 w-6 animate-pulse" />
          <span>جاري البحث...</span>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchPageContent />
    </Suspense>
  );
}
