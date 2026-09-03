"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { HomeBannerSlider } from "@/components/HomeBannerSlider";
import { CategorySlider } from "@/components/CategorySlider";
import { BrandGrid } from "@/components/BrandGrid";
import { ProductGrid } from "@/components/ProductGrid";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";

export function HomePageClient() {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  return (
    <div className="min-h-screen w-full antialiased">
      <Navbar />

      {/* 
        - موبايل: pt-[calc(56px+36px)] لاستيعاب الهيدر (56px) + شريط التنقل المباشر (~36px)
        - ديسكتوب: pt-20 للهيدر التقليدي
        - pb-16 موبايل للـ BottomNav + pb-0 على الديسكتوب
      */}
      <main className="w-full pb-20 pt-[calc(3.5rem+2.5rem)] lg:pb-0 lg:pt-20">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">

          {/* بنر الصفحة الرئيسية */}
          <HomeBannerSlider />

          {/* التصنيفات — فوق المنتجات على الموبايل */}
          <CategorySlider className="mb-8 sm:mb-10" />

          {/* شبكة المنتجات */}
          <ProductGrid selectedBrandId={selectedBrandId} mixedLatest />

          {/* الماركات */}
          <BrandGrid
            selectedBrandId={selectedBrandId}
            onSelectBrand={setSelectedBrandId}
          />

          <Footer />
        </div>
      </main>

      {/* شريط التنقل السفلي — موبايل فقط */}
      <BottomNav />
    </div>
  );
}
