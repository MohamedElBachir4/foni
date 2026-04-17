"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getProductImageUrl } from "@/lib/productImage";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Brand = {
  _id: string;
  name: string;
  slug?: string;
};

type PhoneType = {
  _id: string;
  name: string;
  image?: string;
};

function normalizeSlug(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, "-");
}

export default function BrandSparePartsModelsPage() {
  const params = useParams<{ brand: string }>();
  const brandParam = (params.brand || "").toLowerCase();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [models, setModels] = useState<PhoneType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const brandRes = await fetch(`${API_URL}/api/brands`, { cache: "no-store" });
        if (!brandRes.ok) throw new Error("تعذر جلب الماركات");
        const brands: Brand[] = await brandRes.json();
        const found =
          brands.find((b) => b.slug && b.slug.toLowerCase() === brandParam) ||
          brands.find((b) => normalizeSlug(b.name) === brandParam) ||
          null;

        if (!found) {
          if (!cancelled) {
            setBrand(null);
            setModels([]);
            setError("لم يتم العثور على هذه الماركة في قاعدة البيانات.");
          }
          return;
        }

        if (!cancelled) setBrand(found);

        const res = await fetch(
          `${API_URL}/api/phone-types?brand=${encodeURIComponent(found._id)}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("فشل جلب موديلات الهواتف");
        const data = await res.json();
        if (!cancelled) setModels(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "تعذر تحميل موديلات الهواتف";
          const isNetwork =
            msg.includes("fetch") ||
            msg.includes("Failed to fetch") ||
            msg.includes("NetworkError");
          setError(isNetwork ? "لا يمكن الاتصال بالخادم. شغّل خادم الـ API." : msg);
          setModels([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [brandParam]);

  if (!brand && !loading && !error) return null;

  return (
    <div className="min-h-screen w-full antialiased bg-gradient-to-b from-slate-50 to-white">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <header className="mb-10 sm:mb-12">
          <nav className="mb-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-blue-600">
              الرئيسية
            </Link>
            <span aria-hidden>/</span>
            <Link href={`/brand/${brandParam}`} className="hover:text-blue-600">
              {brand?.name ?? brandParam}
            </Link>
            <span aria-hidden>/</span>
            <span className="font-medium text-slate-700">قطع غيار الهواتف</span>
          </nav>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            اختر الموديل
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
            اختر موديل هاتفك لعرض قطع الغيار المتوفرة له.
          </p>
        </header>

        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
              <p className="text-sm font-medium text-slate-500">جاري تحميل الموديلات...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-6 text-center shadow-sm">
            <p className="font-medium text-amber-800">{error}</p>
            <p className="mt-2 text-xs text-slate-500">{API_URL}</p>
          </div>
        ) : models.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/80 py-16 text-center shadow-sm">
            <div className="mb-4 text-5xl opacity-60">📱</div>
            <p className="text-base font-medium text-slate-600">لا توجد موديلات لهذه الماركة بعد</p>
            <p className="mt-1 text-sm text-slate-500">يمكن إضافتها من لوحة التحكم</p>
          </div>
        ) : brand ? (
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {models.map((m) => (
              <Link
                key={m._id}
                href={`/spare-parts/${brand._id}/${m._id}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-right shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-2 hover:ring-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:rounded-[1.25rem]"
              >
                <div className="relative flex min-h-[140px] items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4 py-8 sm:min-h-[160px]">
                  {m.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getProductImageUrl(m.image)}
                      alt={m.name}
                      className="max-h-[120px] w-full max-w-[120px] object-contain transition-transform duration-300 group-hover:scale-105 sm:max-h-[140px] sm:max-w-[140px]"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                      </svg>
                    </div>
                  )}
                  <span className="absolute start-3 top-3 rounded-lg bg-blue-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                    موديل
                  </span>
                </div>
                <div className="flex flex-1 flex-col border-t border-slate-100 p-4">
                  <h3 className="mb-3 line-clamp-2 text-sm font-bold leading-snug text-slate-800 group-hover:text-blue-700">
                    {m.name}
                  </h3>
                  <span className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors group-hover:bg-blue-700">
                    عرض قطع الغيار
                    <svg className="h-4 w-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
