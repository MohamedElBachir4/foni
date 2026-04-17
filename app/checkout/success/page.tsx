"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CheckCircle, Home, ArrowLeft } from "lucide-react";

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-white antialiased">
      <Navbar />
      <main className="mx-auto max-w-xl px-4 pb-24 pt-28 sm:pt-32">
        <div className="rounded-3xl border-0 bg-white p-8 text-center shadow-xl shadow-slate-200/50 sm:p-12">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/30">
            <CheckCircle className="h-10 w-10 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
            تم استلام طلبك بنجاح
          </h1>
          <p className="mt-3 text-slate-600">
            سنتواصل معك قريباً لتأكيد الطلب وترتيب التوصيل. شكراً لثقتك بنا.
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
              href="/phones"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-slate-200 bg-white px-6 py-3.5 font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
            >
              <ArrowLeft className="h-5 w-5" />
              متابعة التسوق
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
