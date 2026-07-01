"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { HomeBannerSlider } from "@/components/HomeBannerSlider";
import { CategorySlider } from "@/components/CategorySlider";
import { BrandGrid } from "@/components/BrandGrid";
import { ProductGrid } from "@/components/ProductGrid";
import { Footer } from "@/components/Footer";

export function HomePageClient() {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  return (
    <div className="min-h-screen w-full antialiased">
      <Navbar />
      <main className="w-full pb-16 pt-20">
        <HomeBannerSlider />
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <CategorySlider />
          <ProductGrid selectedBrandId={selectedBrandId} mixedLatest />
          <BrandGrid
            selectedBrandId={selectedBrandId}
            onSelectBrand={setSelectedBrandId}
          />
          <Footer />
        </div>
      </main>
    </div>
  );
}
