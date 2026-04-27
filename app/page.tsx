"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { CategorySlider } from "@/components/CategorySlider";
import { BrandGrid } from "@/components/BrandGrid";
import { ProductGrid } from "@/components/ProductGrid";
import { Footer } from "@/components/Footer";

export default function Home() {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  return (
    <div className="min-h-screen w-full p-1.5 antialiased sm:p-2.5">
      <div className="min-h-[calc(100dvh-0.5rem)] rounded-2xl border border-slate-200 bg-white/25 shadow-sm sm:rounded-3xl sm:min-h-[calc(100dvh-1.25rem)]">
        <Navbar />
        <main className="mx-auto max-w-7xl px-6 pb-16 pt-28 lg:px-8">
          <Hero />
          <CategorySlider />
          <ProductGrid selectedBrandId={selectedBrandId} />
          <BrandGrid
            selectedBrandId={selectedBrandId}
            onSelectBrand={setSelectedBrandId}
          />
          <Footer />
        </main>
      </div>
    </div>
  );
}
