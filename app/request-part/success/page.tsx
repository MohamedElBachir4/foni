"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CheckCircle2, Home, Wrench, ArrowLeft } from "lucide-react";

export default function RequestPartSuccessPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-white antialiased">
      <Navbar />
      <main className="mx-auto max-w-xl px-4 pb-24 pt-28 sm:pt-32">
        <div className="rounded-3xl border-0 bg-white p-8 text-center shadow-xl shadow-slate-200/50 sm:p-12">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="h-10 w-10 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 sm:text-3xl">
            تم إرسال طلب القطعة بنجاح
          </h1>
          <p className="mt-3 text-slate-600">
            استلمنا طلبك، وسيقوم فريق Foni بمراجعة التفاصيل والتواصل معك في أقرب وقت.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-l from-blue-600 to-blue-500 px-6 py-3.5 font-bold text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-500 hover:to-blue-600 hover:shadow-xl"
            >
              <Home className="h-5 w-5" />
              العودة للرئيسية
            </Link>
            <Link
              href="/request-part"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-slate-200 bg-white px-6 py-3.5 font-semibold text-slate-700 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <Wrench className="h-5 w-5" />
              إرسال طلب جديد
            </Link>
          </div>
          <Link
            href="/products"
            className="mt-4 inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            متابعة التصفح
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
