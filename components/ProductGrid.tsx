"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { type Product } from "@/lib/productsData";
import { ProductGridCard } from "@/components/ProductGridCard";
import { BestSellingCarousel } from "@/components/BestSellingCarousel";
import {
  ModelChoiceGrid,
  type IphoneModelItem,
} from "@/components/brand/IphoneModelSections";
import { useAccount } from "@/context/AccountContext";
import { getEffectivePrice, getPricingAccount } from "@/lib/pricing";
import { sortPhoneTypesForAppleIphone } from "@/lib/iphoneModelOrder";
import { formatPublicFetchError, publicFetch } from "@/lib/publicFetch";

const HOME_LATEST_TIMEOUT_MS = 22_000;
const HOME_LATEST_MAX_RETRIES = 2;

export type { Product };

type ProductGridProps = {
  selectedBrandId: string | null;
  /** موديل نوع الهاتف (ObjectId) — يضيّق قائمة الهواتف عند الوجود */
  phoneTypeId?: string | null;
  mixedLatest?: boolean;
  /** عرض قسم الأكثر مبيعاً (4 منتجات ثابتة) */
  bestSelling?: boolean;
  /** عنوان مخصص للقسم */
  sectionTitle?: string;
};

const MONGO_ID = /^[a-f0-9]{24}$/i;

type LatestModelRow = IphoneModelItem & { href: string; createdAt?: string };

function mapApiPhoneToProduct(phone: {
  _id: string;
  name: string;
  price?: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
  brand?: { slug?: string; name?: string };
  image?: string;
  colors?: string[];
  createdAt?: string;
}): Product & { colors?: string[] } & {
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
  createdAt?: string;
} {
  const b = typeof phone.brand === "object" ? phone.brand : null;
  const brandSlug =
    b?.slug || (b?.name ? b.name.toLowerCase().trim().replace(/\s+/g, "-") : "");

  const base = {
    id: phone._id,
    name: phone.name,
    price: phone.price ?? 0,
    brand: brandSlug,
    category: "هواتف",
    image: phone.image ?? "",
    colors: Array.isArray(phone.colors) ? phone.colors : [],
    priceRetail: phone.priceRetail,
    priceWholesale: phone.priceWholesale,
    priceReparateur: phone.priceReparateur,
    createdAt: phone.createdAt,
  };
  return base;
}

export function ProductGrid({
  selectedBrandId,
  phoneTypeId: phoneTypeIdProp,
  mixedLatest = false,
  bestSelling = false,
  sectionTitle,
}: ProductGridProps) {
  const phoneTypeId = useMemo(() => {
    if (!phoneTypeIdProp || !MONGO_ID.test(phoneTypeIdProp)) return null;
    return phoneTypeIdProp;
  }, [phoneTypeIdProp]);

  const [page, setPage] = useState(0);
  const [apiProducts, setApiProducts] = useState<
    (Product & { colors?: string[] } & {
      priceRetail?: number;
      priceWholesale?: number;
      priceReparateur?: number;
      createdAt?: string;
      detailHref?: string;
      href?: string;
    })[]
  >([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hasHydratedCache, setHasHydratedCache] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const fetchGenRef = useRef(0);
  const { account, hydrated } = useAccount();
  const pricingAccount = useMemo(() => getPricingAccount(account), [account]);
  const accountFetchKey = account?.id ?? "guest";
  const queryKey = useMemo(
    () =>
      bestSelling
        ? `best-selling|${accountFetchKey}`
        : `${selectedBrandId || "all"}|${phoneTypeId || "all"}|${accountFetchKey}`,
    [selectedBrandId, phoneTypeId, accountFetchKey, bestSelling]
  );

  useEffect(() => {
    setHasHydratedCache(false);
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(`phones:grid:${queryKey}`);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0) {
        setApiProducts(parsed as (Product & { colors?: string[] })[]);
        setHasHydratedCache(true);
      }
    } catch {
      // ignore corrupted cache
    }
  }, [queryKey]);

  const mapResponseToProducts = useCallback(
    (data: unknown, isMixedHome: boolean) => {
      if (!Array.isArray(data)) return [];
      if (isMixedHome) {
        return data.map((row: any) => {
          const id = String(row.phoneTypeId || row.id || row._id || "");
          const href =
            typeof row.detailHref === "string" && row.detailHref.trim()
              ? row.detailHref.trim()
              : "";
          return {
            id,
            _id: id,
            name: String(row.name || ""),
            image: String(row.image || ""),
            href,
            detailHref: href,
            brand: String(row.brandSlug || ""),
            category: "موديل",
            price: 0,
            createdAt: row.createdAt,
          };
        });
      }
      const list = data.map(mapApiPhoneToProduct);
      const isApple = list.length > 0 && list[0]!.brand === "apple";
      if (isApple) return sortPhoneTypesForAppleIphone(list);
      return list.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
    },
    []
  );

  useEffect(() => {
    if (!hydrated) return;

    const isMixedHome = mixedLatest && !selectedBrandId && !phoneTypeId && !bestSelling;
    const endpoint = (() => {
      if (bestSelling) return "/api/home/best-selling-products";
      if (isMixedHome) return "/api/home/latest-products";
      const q = new URLSearchParams();
      if (selectedBrandId && selectedBrandId !== "all") {
        q.set("brand", selectedBrandId);
      }
      if (phoneTypeId) q.set("phoneType", phoneTypeId);
      return `/api/phones${q.toString() ? `?${q.toString()}` : ""}`;
    })();

    const gen = ++fetchGenRef.current;
    const isStale = () => gen !== fetchGenRef.current;
    const ac = new AbortController();

    setApiLoading(true);
    setFetchError(null);

    publicFetch(endpoint, {
      signal: ac.signal,
      timeoutMs: HOME_LATEST_TIMEOUT_MS,
      maxRetries: HOME_LATEST_MAX_RETRIES,
      cache: "no-store",
    })
      .then(async (res) => {
        if (isStale()) return;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const msg =
            typeof body?.error === "string" && body.error.trim()
              ? body.error
              : res.status === 504
                ? "انتهت مهلة جلب المنتجات. حاول مجدداً."
                : "تعذّر جلب المنتجات.";
          throw new Error(msg);
        }
        return res.json();
      })
      .then((data) => {
        if (isStale()) return;
        const mapped = mapResponseToProducts(data, isMixedHome || bestSelling);
        setApiProducts(mapped);
        if (typeof window !== "undefined" && mapped.length > 0) {
          try {
            window.sessionStorage.setItem(`phones:grid:${queryKey}`, JSON.stringify(mapped));
          } catch {
            // ignore storage quota errors
          }
        }
      })
      .catch((err) => {
        if (isStale() || ac.signal.aborted) return;
        setApiProducts((prev) => prev);
        setFetchError(
          formatPublicFetchError(err, "تعذّر جلب المنتجات. تحقق من الاتصال وحاول مجدداً.")
        );
      })
      .finally(() => {
        if (!isStale()) setApiLoading(false);
      });

    return () => {
      ac.abort();
    };
  }, [
    selectedBrandId,
    phoneTypeId,
    queryKey,
    mixedLatest,
    bestSelling,
    accountFetchKey,
    hydrated,
    retryNonce,
    mapResponseToProducts,
  ]);

  const retryFetch = useCallback(() => {
    setRetryNonce((n) => n + 1);
  }, []);

  const isBrandPage = !!(selectedBrandId && selectedBrandId !== "all");
  const isLatestHome = mixedLatest && !isBrandPage && !bestSelling;

  const productsPerPage = bestSelling ? 4 : 4;

  const filteredProducts = useMemo(() => {
    return apiProducts;
  }, [apiProducts]);

  const latestModels = useMemo((): LatestModelRow[] => {
    if (!isLatestHome) return [];
    return filteredProducts.map((p) => ({
      _id: String(p.id),
      name: p.name,
      image: p.image,
      href: String(p.detailHref || p.href || "").trim(),
      createdAt: p.createdAt,
    }));
  }, [filteredProducts, isLatestHome]);

  useEffect(() => {
    // eslint-disable-next-line
    setPage(0);
  }, [selectedBrandId, productsPerPage, phoneTypeId]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage));
  const currentPage = Math.min(page, totalPages - 1);
  const visibleProducts = isBrandPage
    ? filteredProducts
    : bestSelling
    ? filteredProducts.slice(0, 4)
    : filteredProducts.slice(
        currentPage * productsPerPage,
        currentPage * productsPerPage + productsPerPage
      );

  const visibleLatestModels = useMemo(() => {
    if (!isLatestHome) return [];
    return latestModels.slice(
      currentPage * productsPerPage,
      currentPage * productsPerPage + productsPerPage
    );
  }, [isLatestHome, latestModels, currentPage, productsPerPage]);

  const goNext = () => setPage((p) => Math.min(p + 1, totalPages - 1));
  const goPrev = () => setPage((p) => Math.max(p - 1, 0));

  return (
    <section className="mb-20">
      {!isBrandPage && (
        <div className="mb-10">
          <h2 className="flex items-center gap-3 text-3xl font-bold text-gray-800">
            <span
              className={`h-8 w-1.5 rounded-full bg-gradient-to-b ${
                bestSelling ? "from-amber-500 to-orange-400" : "from-blue-600 to-blue-400"
              }`}
            />
            {sectionTitle || (bestSelling ? "الأكثر مبيعاً" : "أحدث المنتجات")}
          </h2>
        </div>
      )}

      {apiLoading && !hasHydratedCache && filteredProducts.length === 0 && !fetchError ? (
        <div className="py-20 text-center">
          <div className="rounded-[40px] bg-white/80 p-12 shadow-2xl backdrop-blur-sm">
            <div className="mb-4 text-2xl font-medium text-slate-500">جاري التحميل...</div>
          </div>
        </div>
      ) : fetchError && filteredProducts.length === 0 ? (
        <div className="py-16 text-center">
          <div className="rounded-[40px] border border-amber-200 bg-amber-50/90 p-8 shadow-lg sm:p-10">
            <p className="mb-4 text-sm font-medium leading-relaxed text-amber-900 sm:text-base">
              {fetchError}
            </p>
            <button
              type="button"
              onClick={retryFetch}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              <RefreshCw className="h-4 w-4" />
              إعادة المحاولة
            </button>
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-20 text-center">
          <div className="rounded-[40px] bg-white/80 p-12 shadow-2xl backdrop-blur-sm">
            <div className="mb-4 text-6xl text-blue-300">📦</div>
            <p className="text-2xl font-medium text-gray-500">لا توجد منتجات تطابق بحثك</p>
          </div>
        </div>
      ) : bestSelling ? (
        <BestSellingCarousel products={visibleProducts} pricingAccount={pricingAccount} />
      ) : isLatestHome ? (
        <>
          <div className="sm:hidden">
            <ModelChoiceGrid
              models={latestModels.filter((m) => m.href)}
              getHref={(m) => (m as LatestModelRow).href}
              ctaLabel="متابعة"
            />
          </div>

          <div className="hidden sm:flex sm:flex-nowrap sm:items-center sm:gap-4">
            <button
              type="button"
              onClick={goNext}
              disabled={currentPage >= totalPages - 1 || latestModels.length === 0}
              aria-label="المزيد من الموديلات"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:pointer-events-none disabled:opacity-50"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>

            <div className="min-w-0 flex-1">
              <ModelChoiceGrid
                models={visibleLatestModels.filter((m) => m.href)}
                getHref={(m) => (m as LatestModelRow).href}
                ctaLabel="متابعة"
                className="sm:grid-cols-2 lg:grid-cols-4"
              />
            </div>

            <button
              type="button"
              onClick={goPrev}
              disabled={currentPage === 0 || latestModels.length === 0}
              aria-label="الموديلات السابقة"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:pointer-events-none disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </>
      ) : (
        <div
          className={`grid ${
            isBrandPage
              ? "grid-cols-2 gap-2 sm:gap-2 lg:grid-cols-4"
              : "grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2 lg:grid-cols-4"
          }`}
        >
          {visibleProducts.map((product, index) => {
            const tiered = product as {
              price?: number;
              priceRetail?: number;
              priceWholesale?: number;
              priceReparateur?: number;
            };
            const effectivePrice = getEffectivePrice(
              {
                price: tiered.price,
                priceRetail: tiered.priceRetail,
                priceWholesale: tiered.priceWholesale,
                priceReparateur: tiered.priceReparateur,
              },
              pricingAccount
            );
            return (
              <ProductGridCard
                key={product.id}
                product={product}
                effectivePrice={effectivePrice}
                index={index}
                imageSizes={
                  isBrandPage
                    ? "(max-width: 640px) 50vw, 25vw"
                    : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                }
                className="overflow-visible hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_40px_rgba(37,99,235,0.16)] sm:overflow-hidden"
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
