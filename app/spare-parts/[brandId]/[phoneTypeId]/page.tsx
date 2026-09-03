"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductGridCard } from "@/components/ProductGridCard";
import { useAccount } from "@/context/AccountContext";
import { getEffectivePrice, getPricingAccount } from "@/lib/pricing";
import { resolveBrandRouteParam } from "@/lib/resolveBrandRouteParam";

import { publicFetch } from "@/lib/publicFetch";

const PAGE_SIZE = 24;

type SparePart = {
  _id: string;
  name: string;
  details?: string;
  image?: string;
  colors?: string[];
  price: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
  brand?: { _id: string; name: string };
  phoneType?: { _id: string; name: string };
  options?: string[];
};

type Brand = { _id: string; name: string };
type PhoneType = { _id: string; name: string };

export default function SparePartsListPage() {
  const params = useParams<{ brandId: string; phoneTypeId: string }>();
  const brandId = params.brandId;
  const phoneTypeId = params.phoneTypeId;
  const [parts, setParts] = useState<SparePart[]>([]);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [phoneType, setPhoneType] = useState<PhoneType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [page, setPage] = useState(1);
  const { account } = useAccount();
  const pricingAccount = useMemo(() => getPricingAccount(account), [account]);

  const totalPages = Math.max(1, Math.ceil(parts.length / PAGE_SIZE));
  const visibleParts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return parts.slice(start, start + PAGE_SIZE);
  }, [parts, page]);

  useEffect(() => {
    setPage(1);
  }, [phoneTypeId]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const handler = () => setIsMobile(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!phoneTypeId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const ptId = String(phoneTypeId);
        const [partsRes, brandsRes, phoneTypeOneRes] = await Promise.all([
          publicFetch(
            `/api/spare-parts?phoneType=${encodeURIComponent(ptId)}&limit=500`
          ),
          publicFetch("/api/brands"),
          publicFetch(`/api/phone-types/${encodeURIComponent(ptId)}`),
        ]);

        if (!partsRes.ok) throw new Error("فشل جلب قطع الغيار");

        const [data, brandsJson, ptOne] = await Promise.all([
          partsRes.json(),
          brandsRes.json().catch(() => []),
          phoneTypeOneRes.ok
            ? phoneTypeOneRes.json()
            : Promise.resolve(null),
        ]);

        const list: SparePart[] =
          data.parts ?? (Array.isArray(data) ? data : []);
        const brands: Brand[] = Array.isArray(brandsJson) ? brandsJson : [];

        if (!cancelled) setParts(list);

        if (ptOne && ptOne._id) {
          if (!cancelled) {
            setPhoneType({ _id: String(ptOne._id), name: String(ptOne.name || "") });
            const b = ptOne.brand as { _id?: string; name?: string } | undefined;
            if (b && b._id) {
              setBrand({ _id: String(b._id), name: String(b.name || "") });
            } else {
              const resolved = resolveBrandRouteParam(brandId, brands);
              setBrand({
                _id: resolved.mongoId ?? brandId,
                name: resolved.displayName,
              });
            }
          }
        } else {
          if (!cancelled && list[0]?.phoneType) {
            setPhoneType(list[0].phoneType);
          }
          if (!cancelled && list[0]?.brand) {
            setBrand(list[0].brand);
          }
          const resolved = resolveBrandRouteParam(brandId, brands);
          if (!cancelled && !list[0]?.brand) {
            setBrand({
              _id: resolved.mongoId ?? brandId,
              name: resolved.displayName,
            });
          }
          if (!cancelled && !list[0]?.phoneType && resolved.mongoId) {
            const ptRes2 = await publicFetch(
              `/api/phone-types?brand=${encodeURIComponent(
                resolved.mongoId
              )}`
            );
            if (ptRes2.ok) {
              const types: PhoneType[] = await ptRes2.json();
              const found =
                types.find((t) => t._id === phoneTypeId) ?? null;
              if (found && !cancelled) setPhoneType(found);
            }
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg =
            err instanceof Error ? err.message : "تعذر تحميل قطع الغيار";
          setError(msg);
          setParts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [brandId, phoneTypeId]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-white antialiased">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <header className="mb-10 sm:mb-12">
          <nav className="mb-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <a href="/spare-parts" className="hover:text-slate-700">
              قطع غيار الهواتف
            </a>
            <span aria-hidden>/</span>
            <a href={`/spare-parts/${brandId}`} className="hover:text-slate-700">
              {brand?.name || "الماركة"}
            </a>
            <span aria-hidden>/</span>
            <span className="font-medium text-slate-700">
              {phoneType?.name || "الموديل"}
            </span>
          </nav>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            قطع الغيار — {phoneType?.name || "الموديل"}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
            اختر القطعة وأضفها إلى السلة.
            {parts.length > 0 ? (
              <span className="mr-1 text-slate-500">
                ({parts.length} قطعة)
              </span>
            ) : null}
          </p>
        </header>

        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
              <p className="text-sm font-medium text-slate-500">جاري تحميل قطع الغيار...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-6 text-center shadow-sm">
            <p className="font-medium text-amber-800">{error}</p>
            <p className="mt-3 text-sm text-slate-600">
              تأكد من تشغيل خادم الـ API.
            </p>
          </div>
        ) : parts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/80 py-16 text-center shadow-sm">
            <div className="mb-4 text-5xl opacity-60">🔧</div>
            <p className="text-base font-medium text-slate-600">لا توجد قطع غيار لهذا الموديل بعد</p>
            <p className="mt-1 text-sm text-slate-500">يمكن إضافتها من لوحة التحكم — قسم قطع الغيار</p>
          </div>
        ) : (
          <div className={isMobile ? "" : "flex flex-nowrap items-center gap-2 sm:gap-4"}>
            <div className={isMobile ? "" : "min-w-0 flex-1"}>
              <div
                className={`grid ${isMobile ? "grid-cols-2 gap-3 sm:gap-4" : "grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"}`}
              >
                {visibleParts.map((part, index) => {
                  const effectivePrice = getEffectivePrice(
                    {
                      price: part.price,
                      priceRetail: (part as any).priceRetail,
                      priceWholesale: (part as any).priceWholesale,
                      priceReparateur: (part as any).priceReparateur,
                    },
                    pricingAccount
                  );
                  return (
                  <ProductGridCard
                    key={part._id}
                    product={{
                      id: part._id,
                      name: part.name,
                      image: part.image ?? "",
                      price: part.price ?? 0,
                      priceRetail: part.priceRetail ?? part.price,
                      priceWholesale: part.priceWholesale,
                      priceReparateur: part.priceReparateur,
                      colors: Array.isArray(part.colors) ? part.colors : [],
                      options: Array.isArray(part.options) ? part.options : [],
                      brand: "",
                      category: "قطع غيار",
                    }}
                    effectivePrice={effectivePrice ?? 0}
                    priority={page === 1 && index < 2}
                    imageSizes={isMobile ? "(max-width: 640px) 45vw, 180px" : "(max-width: 1024px) 25vw, 220px"}
                    className="hover:-translate-y-1"
                  />
                  );
                })}
              </div>
              {totalPages > 1 && (
                <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    السابق
                  </button>
                  <span className="px-2 text-sm text-slate-600">
                    صفحة {page} من {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    التالي
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
