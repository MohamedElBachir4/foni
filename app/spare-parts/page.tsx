"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SparePartsBrandGrid } from "@/components/SparePartsBrandGrid";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Brand = { _id: string; name: string; image?: string };

export default function SparePartsBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/api/brands`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("فشل جلب الماركات");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setBrands(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "تعذر تحميل الماركات");
        setBrands([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen w-full antialiased">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 pb-16 pt-28 lg:px-8">
        <section className="mb-10">
          <h1 className="mb-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            قطع غيار الهواتف
          </h1>
          <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
            اختر الماركة لعرض موديلات الهواتف وقطع الغيار الخاصة بها.
          </p>
        </section>

        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-slate-200 bg-white/80">
            <p className="text-slate-500">جاري تحميل الماركات...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-center">
            <p className="text-amber-800">{error}</p>
            <p className="mt-2 text-sm text-slate-600">
              تأكد من تشغيل خادم الـ API ({API_URL})
            </p>
          </div>
        ) : (
          <SparePartsBrandGrid brands={brands} />
        )}

        <Footer />
      </main>
    </div>
  );
}
