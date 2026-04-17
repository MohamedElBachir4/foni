"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { BrandGrid } from "@/components/BrandGrid";
import { Footer } from "@/components/Footer";

export default function PhonesBrandsPage() {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  return (
    <div className="min-h-screen w-full antialiased">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 pb-16 pt-28 lg:px-8">
        <section className="mb-10">
          <h1 className="mb-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            الهواتف النقالة
          </h1>
          <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
            اختر الماركة من بين أشهر الماركات العالمية لعرض الهواتف والإكسسوارات وقطع الغيار
            المرتبطة بها لاحقاً.
          </p>
        </section>

        <BrandGrid
          selectedBrandId={selectedBrandId}
          onSelectBrand={setSelectedBrandId}
          category="phones"
        />

        <Footer />
      </main>
    </div>
  );
}

