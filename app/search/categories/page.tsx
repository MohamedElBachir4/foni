"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Headphones, Smartphone, Wrench } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

function CategoriesBody() {
  const sp = useSearchParams();
  const q = sp.get("q") || "";
  const qe = encodeURIComponent(q);

  return (
    <div className="min-h-screen w-full bg-slate-50 antialiased">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-32">
        <h1 className="mb-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">اختر القسم</h1>
        {q ? (
          <p className="mb-8 text-slate-600">
            البحث عن: <span className="font-semibold text-slate-800">&quot;{q}&quot;</span>
          </p>
        ) : (
          <p className="mb-8 text-slate-600">أدخل نص البحث من الشريط أولاً.</p>
        )}

        <div className="grid gap-4 sm:grid-cols-1">
          <Link
            href={q ? `/search?q=${qe}&section=phones` : "/phones"}
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Smartphone className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">الهواتف</h2>
              <p className="text-sm text-slate-500">هواتف جاهزة وموديلات الأجهزة</p>
            </div>
            <span className="mr-auto text-slate-300 transition group-hover:text-blue-500">‹</span>
          </Link>

          <Link
            href={q ? `/search?q=${qe}&section=accessories` : "/accessories"}
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-200 hover:shadow-md"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <Headphones className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">الإكسسوارات</h2>
              <p className="text-sm text-slate-500">كفرات، شواحن، وملحقات</p>
            </div>
            <span className="mr-auto text-slate-300 transition group-hover:text-violet-500">‹</span>
          </Link>

          <Link
            href={q ? `/search?q=${qe}&section=spare-parts` : "/spare-parts"}
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-amber-200 hover:shadow-md"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Wrench className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">قطع الغيار</h2>
              <p className="text-sm text-slate-500">شاشات، بطاريات، وقطع الصيانة</p>
            </div>
            <span className="mr-auto text-slate-300 transition group-hover:text-amber-600">‹</span>
          </Link>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          <Link href={q ? `/search?q=${qe}` : "/search"} className="font-semibold text-blue-600 hover:underline">
            عرض كل الأقسام في صفحة واحدة
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}

function Fallback() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-32 text-center text-slate-500">…</div>
    </div>
  );
}

export default function SearchCategoriesPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <CategoriesBody />
    </Suspense>
  );
}
