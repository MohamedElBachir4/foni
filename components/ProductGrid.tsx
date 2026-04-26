"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { type Product } from "@/lib/productsData";
import { ProductImage } from "@/components/ProductImage";
import { ProductCardActions } from "@/components/ProductCardActions";
import { useAccount } from "@/context/AccountContext";
import { getEffectivePrice, formatDzd } from "@/lib/pricing";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export type { Product };

type ProductGridProps = {
  selectedBrandId: string | null;
  /** موديل نوع الهاتف (ObjectId) — يضيّق قائمة الهواتف عند الوجود */
  phoneTypeId?: string | null;
};

const MONGO_ID = /^[a-f0-9]{24}$/i;

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

export function ProductGrid({ selectedBrandId, phoneTypeId: phoneTypeIdProp }: ProductGridProps) {
  const phoneTypeId = useMemo(() => {
    if (!phoneTypeIdProp || !MONGO_ID.test(phoneTypeIdProp)) return null;
    return phoneTypeIdProp;
  }, [phoneTypeIdProp]);

  const [page, setPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [apiProducts, setApiProducts] = useState<
    (Product & { colors?: string[] } & {
      priceRetail?: number;
      priceWholesale?: number;
      priceReparateur?: number;
      createdAt?: string;
    })[]
  >([]);
  const [apiLoading, setApiLoading] = useState(false);
  const { account } = useAccount();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const handler = () => setIsMobile(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line
    setApiLoading(true);

    const q = new URLSearchParams();
    if (selectedBrandId && selectedBrandId !== "all") {
      q.set("brand", selectedBrandId);
    }
    if (phoneTypeId) q.set("phoneType", phoneTypeId);
    const query = q.toString() ? `?${q.toString()}` : "";

    fetch(`${API_URL}/api/phones${query}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (cancelled) return;
        const mapped = Array.isArray(data)
          ? data
              .map(mapApiPhoneToProduct)
              .sort((a, b) => {
                const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return bTime - aTime;
              })
          : [];
        setApiProducts(mapped);
      })
      .catch(() => {
        if (cancelled) return;
        setApiProducts([]);
      })
      .finally(() => {
        if (cancelled) return;
        setApiLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedBrandId, phoneTypeId]);

  const isBrandPage = !!(selectedBrandId && selectedBrandId !== "all");

  const productsPerPage = isMobile ? 1 : 4;

  const filteredProducts = useMemo(() => {
    return apiProducts;
  }, [apiProducts]);

  useEffect(() => {
    // eslint-disable-next-line
    setPage(0);
  }, [selectedBrandId, productsPerPage, phoneTypeId]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage));
  const currentPage = Math.min(page, totalPages - 1);
  const visibleProducts = isBrandPage
    ? filteredProducts
    : filteredProducts.slice(
      currentPage * productsPerPage,
      currentPage * productsPerPage + productsPerPage
    );

  const goNext = () => setPage((p) => Math.min(p + 1, totalPages - 1));
  const goPrev = () => setPage((p) => Math.max(p - 1, 0));

  return (
    <section className="mb-20">
      {!isBrandPage && (
        <div className="mb-10">
          <h2 className="flex items-center gap-3 text-3xl font-bold text-gray-800">
            <span className="h-8 w-1.5 rounded-full bg-gradient-to-b from-blue-600 to-blue-400" />
            أحدث المنتجات
          </h2>
        </div>
      )}

      <div className={isBrandPage ? "" : "flex flex-nowrap items-center gap-2 sm:gap-4"}>
        {!isBrandPage && (
          <button
            type="button"
            onClick={goNext}
            disabled={currentPage >= totalPages - 1 || filteredProducts.length === 0}
            aria-label="المزيد من المنتجات"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:pointer-events-none disabled:opacity-50"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        )}

        <div className={isBrandPage ? "" : "min-w-0 flex-1"}>
          {apiLoading ? (
            <div className="py-20 text-center">
              <div className="rounded-[40px] bg-white/80 p-12 shadow-2xl backdrop-blur-sm">
                <div className="mb-4 text-2xl font-medium text-slate-500">جاري التحميل...</div>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center">
              <div className="rounded-[40px] bg-white/80 p-12 shadow-2xl backdrop-blur-sm">
                <div className="mb-4 text-6xl text-blue-300">📦</div>
                <p className="text-2xl font-medium text-gray-500">
                  لا توجد منتجات تطابق بحثك
                </p>
              </div>
            </div>
          ) : (
            <div className={`grid ${isBrandPage ? "grid-cols-2 gap-2 sm:gap-2 lg:grid-cols-4" : "grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2 lg:grid-cols-4"}`}>
              {visibleProducts.map((product, index) => {
                const tiered = product as any;
                const effectivePrice = getEffectivePrice(
                  {
                    price: tiered.price,
                    priceRetail: tiered.priceRetail,
                    priceWholesale: tiered.priceWholesale,
                    priceReparateur: tiered.priceReparateur,
                  },
                  account
                );
                return (
                  <div
                    key={product.id}
                    className="group flex h-full min-h-[340px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 hover:shadow-xl hover:border-slate-200 sm:min-h-[360px] sm:rounded-[1.25rem]"
                  >
                    {/* منطقة الصورة - ارتفاع ثابت */}
                    <div className="relative flex h-[120px] shrink-0 items-center justify-center bg-gradient-to-b from-slate-50 to-white px-3 py-3 sm:h-[130px]">
                      <ProductImage
                        src={product.image}
                        alt={product.name}
                        priority={index < 4}
                        sizes={isBrandPage ? "(max-width: 640px) 50vw, 25vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"}
                        className="object-contain w-full max-w-[100px] sm:max-w-[130px]"
                      />
                      <span className="absolute start-3 top-3 rounded-lg bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm sm:start-4 sm:top-4 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs">
                        {product.category}
                      </span>
                      <button
                        type="button"
                        aria-label="إضافة للمفضلة"
                        className="absolute end-3 top-3 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-red-500 sm:end-4 sm:top-4 sm:p-2"
                      >
                        <Heart className="h-4 w-4 text-slate-500 sm:h-5 sm:w-5" strokeWidth={1.5} />
                      </button>
                    </div>

                    {/* المحتوى - ارتفاع موحّد */}
                    <div className="flex min-h-0 flex-1 flex-col border-t border-slate-100 p-3">
                      <h3 className="mb-1.5 min-h-[2.5rem] text-center text-sm font-bold leading-snug text-slate-900 line-clamp-2 sm:text-base">
                        {product.name}
                      </h3>

                      {effectivePrice > 0 ? (
                        <p className="mb-1.5 text-center">
                          <span className="text-xl font-black text-slate-900 sm:text-2xl">
                            {formatDzd(effectivePrice)}
                          </span>
                          <span className="mr-1 text-sm font-semibold text-slate-500">DA</span>
                        </p>
                      ) : (
                        <p className="mb-1.5 min-h-[1.5rem] text-center text-sm font-semibold text-slate-400">— DA</p>
                      )}

                      {/* مساحة ثابتة للألوان (1–5 دوائر) والأزرار */}
                      <ProductCardActions
                        id={String(product.id)}
                        name={product.name}
                        price={effectivePrice}
                        image={product.image}
                        colors={Array.isArray((product as Product & { colors?: string[] }).colors) ? (product as Product & { colors?: string[] }).colors : undefined}
                        category={product.category}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {!isBrandPage && (
          <button
            type="button"
            onClick={goPrev}
            disabled={currentPage === 0 || filteredProducts.length === 0}
            aria-label="المنتجات السابقة"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:pointer-events-none disabled:opacity-50"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
        )}
      </div>
    </section>
  );
}
