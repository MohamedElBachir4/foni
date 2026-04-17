"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Crown, Tag, Truck, UserPlus, Package, ChevronLeft } from "lucide-react";

const HERO_IMAGES = [
  {
    src: "https://i.pinimg.com/736x/e3/f4/a2/e3f4a286400d050bad935c6853879d6e.jpg",
    alt: "iPhone Pro Max",
  },
  {
    src: "https://i.pinimg.com/736x/a1/f6/e2/a1f6e266de71fe64b1eb4a68b91c00ee.jpg",
    alt: "اكسسوارات الهواتف",
  },
  {
    src: "https://i.pinimg.com/736x/02/c2/62/02c262e51afde8e065fc64aac01eb378.jpg",
    alt: "قطع غيار الهواتف",
  },
  {
    src: "https://i.pinimg.com/736x/06/70/df/0670df91bdb647db57a86e9170913dbe.jpg",
    alt: "منتجات الهواتف",
  },
  {
    src: "https://i.pinimg.com/1200x/07/54/4a/07544a0c13ce4a27642a05c6a1727f49.jpg",
    alt: "هواتف وإكسسوارات",
  },
];

const SLIDE_DURATION_MS = 500;
const INTERVAL_MS = 3000;

export function Hero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [leaveIndex, setLeaveIndex] = useState<number | null>(null);
  const [enterIndex, setEnterIndex] = useState<number | null>(null);

  const goNext = useCallback(() => {
    if (isTransitioning) return;
    const next = (activeIndex + 1) % HERO_IMAGES.length;
    setLeaveIndex(activeIndex);
    setEnterIndex(next);
    setIsTransitioning(true);
    const t = setTimeout(() => {
      setActiveIndex(next);
      setIsTransitioning(false);
      setLeaveIndex(null);
      setEnterIndex(null);
    }, SLIDE_DURATION_MS);
    return () => clearTimeout(t);
  }, [activeIndex, isTransitioning]);

  useEffect(() => {
    const timer = setInterval(goNext, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [goNext]);
  return (
    <section className="relative mb-8 sm:mb-12 lg:mb-14">
      <div className="absolute left-0 top-0 h-72 w-72 animate-pulse rounded-full bg-blue-200 opacity-20 mix-blend-multiply filter blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 animate-pulse rounded-full bg-blue-300 opacity-20 mix-blend-multiply filter blur-3xl delay-1000" />

      <div className="luxury-gradient relative overflow-hidden rounded-[16px] shadow-2xl sm:rounded-[32px] lg:rounded-[40px]">
        <div className="absolute inset-0 backdrop-blur-sm bg-white/10" />
        <div className="relative z-10 flex flex-col items-center gap-2 p-3 sm:gap-4 sm:p-5 lg:flex-row lg:items-center lg:gap-6 lg:p-10">
          <div className="flex w-full flex-1 flex-col items-center text-white lg:items-start">
            <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-2.5 py-1 backdrop-blur-md sm:mb-3 sm:gap-2 sm:px-4 sm:py-2">
              <Crown className="h-3 w-3 text-yellow-300 sm:h-4 sm:w-4" />
              <span className="text-[10px] font-medium sm:text-sm">المجموعة المتكاملة للمحترفين</span>
            </div>

            <h1 className="mb-1.5 text-center text-2xl font-black leading-tight sm:mb-3 sm:text-left sm:text-3xl lg:mb-4 lg:text-5xl">
              <span className="bg-gradient-to-l from-yellow-300 to-white bg-clip-text text-transparent">
                عالم الهواتف بين يديك
              </span>
              <br />
              بيع، صيانة، وتجهيز
            </h1>

            <p className="mb-2 max-w-2xl text-center text-xs leading-relaxed text-blue-50 sm:mb-4 sm:text-left sm:text-base lg:mb-5 lg:text-xl">
              هواتف ذكية، إكسسوارات، وقطع غيار أصلية في مكان واحد
            </p>

            <div className="mb-3 flex flex-wrap justify-center gap-1.5 sm:mb-5 sm:justify-start sm:gap-3 lg:mb-6">
              <div className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-white/30 bg-white/20 px-2 py-1.5 backdrop-blur-md sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-2.5">
                <Tag className="h-2.5 w-2.5 text-yellow-300 sm:h-4 sm:w-4" />
                <span className="text-xs font-medium sm:text-base">مصلح أو بائع -15%</span>
              </div>
              <div className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-white/30 bg-white/20 px-2 py-1.5 backdrop-blur-md sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-2.5">
                <Truck className="h-2.5 w-2.5 text-yellow-300 sm:h-4 sm:w-4" />
                <span className="text-xs font-medium sm:text-base">تجار الجملة -30%</span>
              </div>
            </div>

            <div className="flex w-full max-w-sm flex-col gap-2 sm:max-w-none sm:flex-row sm:flex-wrap sm:gap-3">
              <Link
                href="/accounts"
                className="group relative flex w-full flex-1 items-center justify-center gap-1 rounded-lg border-2 border-white/60 bg-white/20 px-3 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white hover:bg-white/30 hover:shadow-2xl sm:min-w-0 sm:rounded-2xl sm:px-6 sm:py-3 sm:text-base"
              >
                <UserPlus className="h-2.5 w-2.5 sm:h-4 sm:w-4" />
                البيع بالجملة
              </Link>
              <button
                type="button"
                className="group flex w-full flex-1 items-center justify-center gap-1 overflow-hidden rounded-lg border-2 border-white bg-transparent px-3 py-2 text-xs font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 sm:min-w-0 sm:rounded-2xl sm:px-6 sm:py-3 sm:text-base"
              >
                <Package className="h-2.5 w-2.5 sm:h-4 sm:w-4" />
                استكشف المنتجات
                <ChevronLeft className="h-2.5 w-2.5 transition-transform duration-300 group-hover:translate-x-2 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>

          <div className="flex w-full flex-1 justify-center px-1 sm:px-0">
            <div className="group relative w-full max-w-[280px] sm:max-w-sm lg:max-w-md">
              <div className="absolute -inset-1 rounded-[40px] bg-gradient-to-r from-yellow-400 to-yellow-600 opacity-50 blur-xl transition duration-500 group-hover:opacity-75" />
              <div className="absolute -inset-1 rounded-[40px] bg-gradient-to-r from-blue-400 to-blue-600 opacity-50 blur transition duration-500 group-hover:opacity-75" />
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[20px] border-2 border-white/30 shadow-xl transition-transform duration-700 group-hover:scale-105 sm:rounded-[32px] sm:border-4 sm:shadow-2xl">
                {HERO_IMAGES.map((img, i) => {
                  const isLeaving = leaveIndex === i;
                  const isEntering = enterIndex === i;
                  const isActive = !isTransitioning && i === activeIndex;
                  const show = isActive || isLeaving || isEntering;
                  if (!show) return null;
                  return (
                    <img
                      key={img.alt}
                      src={img.src}
                      alt={img.alt}
                      className={`absolute inset-0 h-full w-full object-cover ${
                        isLeaving ? "hero-slide-out z-[5]" : ""
                      } ${isEntering ? "hero-slide-in z-10" : ""} ${
                        isActive ? "z-10" : ""
                      }`}
                    />
                  );
                })}
              </div>
              <div className="glass-card absolute -bottom-4 -right-2 z-30 rounded-xl p-2.5 shadow-xl sm:-bottom-6 sm:-left-6 sm:right-auto sm:rounded-2xl sm:p-4 sm:shadow-2xl">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-green-400 sm:h-12 sm:w-12 sm:rounded-xl">
                    <span className="text-lg font-bold text-white sm:text-2xl">✓</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 sm:text-sm">أصلية 100%</p>
                    <p className="truncate text-sm font-bold text-gray-800 sm:text-base">ضمان شامل</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
