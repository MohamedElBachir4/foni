"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Heart, ShoppingCart } from "lucide-react";
import { ProductImage } from "@/components/ProductImage";
import { AddToCartButton } from "@/components/AddToCartButton";
import { useAccount } from "@/context/AccountContext";
import { getEffectivePrice, formatDzd } from "@/lib/pricing";
import { resolveBrandRouteParam } from "@/lib/resolveBrandRouteParam";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type SparePart = {
  _id: string;
  name: string;
  image?: string;
  price: number;
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
  brand?: { _id: string; name: string };
  phoneType?: { _id: string; name: string };
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
          fetch(
            `${API_URL}/api/spare-parts?phoneType=${encodeURIComponent(ptId)}&limit=500`
          ),
          fetch(`${API_URL}/api/brands`),
          fetch(`${API_URL}/api/phone-types/${encodeURIComponent(ptId)}`),
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
            const ptRes2 = await fetch(
              `${API_URL}/api/phone-types?brand=${encodeURIComponent(
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
                {parts.map((part, index) => {
                  const effectivePrice = getEffectivePrice(
                    {
                      price: part.price,
                      priceRetail: (part as any).priceRetail,
                      priceWholesale: (part as any).priceWholesale,
                      priceReparateur: (part as any).priceReparateur,
                    },
                    account
                  );
                  return (
                  <div
                    key={part._id}
                    className="group flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 hover:shadow-xl hover:border-slate-200 sm:rounded-[1.25rem]"
                  >
                    {/* منطقة الصورة مع الشارات فوقها */}
                    <div className="relative flex min-h-[120px] shrink-0 items-center justify-center bg-gradient-to-b from-slate-50 to-white px-3 py-3 sm:min-h-[130px] sm:py-4">
                      <ProductImage
                        src={part.image ?? ""}
                        alt={part.name}
                        priority={index < 4}
                        sizes={isMobile ? "(max-width: 640px) 50vw, 25vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"}
                        className="object-contain w-full max-w-[100px] sm:max-w-[130px]"
                      />
                      <span className="absolute start-3 top-3 rounded-lg bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm sm:start-4 sm:top-4 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs">
                        قطعة غيار
                      </span>
                      <button
                        type="button"
                        aria-label="إضافة للمفضلة"
                        className="absolute end-3 top-3 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-red-500 sm:end-4 sm:top-4 sm:p-2"
                      >
                        <Heart className="h-4 w-4 text-slate-500 sm:h-5 sm:w-5" strokeWidth={1.5} />
                      </button>
                    </div>

                    {/* المحتوى */}
                    <div className="flex min-h-0 flex-1 flex-col border-t border-slate-100 p-3">
                      <h3 className="mb-2 text-center text-sm font-bold leading-snug text-slate-900 line-clamp-2 sm:text-base">
                        {part.name}
                      </h3>

                      {effectivePrice != null && Number(effectivePrice) > 0 ? (
                        <p className="mb-2 text-center">
                          <span className="text-xl font-black text-slate-900 sm:text-2xl">
                            {formatDzd(effectivePrice)}
                          </span>
                          <span className="mr-1 text-sm font-semibold text-slate-500">DA</span>
                        </p>
                      ) : (
                        <p className="mb-2 text-center text-sm font-semibold text-slate-400">— DA</p>
                      )}

                      <div className="mt-auto flex flex-col gap-2">
                        <AddToCartButton
                          id={part._id}
                          name={part.name}
                          price={effectivePrice}
                          image={part.image ?? ""}
                          className="flex w-full items-center justify-center gap-1.5 rounded-full bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" strokeWidth={2} />
                          أضف للسلة
                        </AddToCartButton>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
