"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { CategorySlider } from "@/components/CategorySlider";
import { BrandGrid } from "@/components/BrandGrid";
import { ProductGrid } from "@/components/ProductGrid";
import { Footer } from "@/components/Footer";

const BANNER_IMAGES = [
  "/hero/foni-hero-1.png",
  "/hero/foni-hero-2.png",
  "https://i.pinimg.com/1200x/b0/62/7d/b0627d443e0a15f72fd0d50088e9770d.jpg",
  "https://i.pinimg.com/736x/fc/7d/03/fc7d035abeb24f90fc3479fc23125c0c.jpg",
  "https://i.pinimg.com/736x/18/c1/f6/18c1f6927373620f36712cf4c547b386.jpg",
  "https://i.pinimg.com/736x/a7/6e/51/a76e5131686ca17149c0cdcbf4dc0400.jpg",
  "https://i.pinimg.com/736x/5c/bd/02/5cbd026a3b8870b922f462366ebd5019.jpg",
];

export function HomePageClient() {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [bannerImageIndex, setBannerImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerImageIndex((prev) => (prev + 1) % BANNER_IMAGES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen w-full antialiased">
      <Navbar />
      <main className="w-full pb-16 pt-20">
        <section className="relative mb-8 w-full overflow-hidden sm:mb-10">
          <div className="relative h-80 w-full sm:h-[26rem] lg:h-[32rem]">
            {BANNER_IMAGES.map((image, index) => (
              <div
                key={image}
                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
                  bannerImageIndex === index ? "opacity-100" : "opacity-0"
                }`}
                style={{ backgroundImage: `url('${image}')` }}
              />
            ))}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/95 via-white/55 to-transparent" />
          <div className="absolute inset-0 bg-slate-900/55" />
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center sm:p-10">
            <div className="max-w-4xl text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
              <h1 className="mb-2 bg-gradient-to-l from-blue-300 via-sky-100 to-white bg-clip-text text-3xl font-black leading-tight text-transparent sm:text-5xl">
                عالم الهواتف بين يديك
              </h1>
              <h2 className="mb-3 text-2xl font-extrabold text-sky-100 sm:text-4xl">
                بيع، صيانة، وتجهيز
              </h2>
              <p className="mx-auto mb-5 max-w-3xl text-sm leading-relaxed text-slate-200 sm:text-lg">
                هواتف ذكية، إكسسوارات، وقطع غيار أصلية في مكان واحد
              </p>
              <div className="mb-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <span className="rounded-full border border-blue-200/70 bg-blue-100/20 px-3 py-1.5 text-xs font-semibold text-blue-100 backdrop-blur-md sm:text-sm">
                  تاجر أو صاحب محل -15%
                </span>
                <span className="rounded-full border border-sky-200/70 bg-sky-100/20 px-3 py-1.5 text-xs font-semibold text-sky-100 backdrop-blur-md sm:text-sm">
                  تجار الجملة -30%
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <Link
                  href="/accounts"
                  className="rounded-xl border border-blue-300/60 bg-gradient-to-r from-blue-700/90 to-blue-900/90 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-950/45 backdrop-blur-sm transition hover:from-blue-600/95 hover:to-blue-800/95 sm:px-6 sm:py-3"
                >
                  فتح حساب
                </Link>
                <Link
                  href="/request-part"
                  className="rounded-xl border border-amber-300/80 bg-amber-400/20 px-4 py-2 text-sm font-bold text-amber-50 shadow-lg shadow-slate-900/20 backdrop-blur-sm transition hover:bg-amber-300/30 sm:px-6 sm:py-3"
                >
                  لم تجد قطعتك؟
                </Link>
              </div>
            </div>
          </div>
        </section>
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
