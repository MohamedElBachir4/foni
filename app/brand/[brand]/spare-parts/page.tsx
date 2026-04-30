"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { IphoneOrPlainModelGrid } from "@/components/brand/IphoneModelSections";

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
            <Link href={`/brand/${brandParam}/models`} className="hover:text-blue-600">
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
          <IphoneOrPlainModelGrid
            brandParam={brandParam}
            brandName={brand.name}
            models={models}
            getHref={(m) => `/spare-parts/${brand._id}/${m._id}`}
            ctaLabel="عرض قطع الغيار"
          />
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
