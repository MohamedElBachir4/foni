"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Flame, Trophy } from "lucide-react";
import { type Product } from "@/lib/productsData";
import { ProductGridCard } from "@/components/ProductGridCard";
import { getEffectivePrice } from "@/lib/pricing";
import type { AccountInfo } from "@/context/AccountContext";

type TieredProduct = Product & {
  colors?: string[];
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
};

type BestSellingCarouselProps = {
  products: TieredProduct[];
  pricingAccount: AccountInfo | null;
};

const AUTOPLAY_MS = 5500;
const SWIPE_THRESHOLD = 48;

const RANK_STYLES = [
  "from-amber-400 via-yellow-300 to-amber-500 text-amber-950 shadow-amber-400/40",
  "from-slate-300 via-slate-100 to-slate-400 text-slate-800 shadow-slate-400/30",
  "from-orange-400 via-amber-300 to-orange-500 text-orange-950 shadow-orange-400/30",
  "from-blue-500 via-blue-400 to-indigo-500 text-white shadow-blue-400/30",
] as const;

function getRankStyle(rank: number) {
  return RANK_STYLES[Math.min(rank, RANK_STYLES.length - 1)]!;
}

type CardMotion = {
  transform: string;
  opacity: number;
  zIndex: number;
  pointerEvents: "auto" | "none";
  filter: string;
};

function getCardMotion(offset: number, dragPx = 0): CardMotion {
  const dragShift = dragPx / 260;
  const adjusted = offset + dragShift;
  const isActive = Math.abs(adjusted) < 0.35;
  const isAdjacent = Math.abs(adjusted) >= 0.35 && Math.abs(adjusted) < 1.35;

  if (!isActive && !isAdjacent) {
    return {
      transform: `translateX(calc(-50% - ${adjusted * 54}%)) translateZ(-140px) rotateY(${adjusted * -10}deg) scale(0.62)`,
      opacity: 0,
      zIndex: 0,
      pointerEvents: "none",
      filter: "blur(3px) brightness(0.85)",
    };
  }

  const scale = isActive ? 1 : 0.76;
  const opacity = isActive ? 1 : 0.48;
  const zIndex = isActive ? 40 : 28 - Math.round(Math.abs(adjusted));
  const rotateY = adjusted * 16;
  const translateZ = isActive ? 60 : -90;
  const brightness = isActive ? 1 : 0.9;

  return {
    transform: `translateX(calc(-50% - ${adjusted * 54}%)) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
    opacity,
    zIndex,
    pointerEvents: isActive ? "auto" : "auto",
    filter: isActive ? "blur(0px)" : `blur(0.4px) brightness(${brightness})`,
  };
}

function RankBadge({ rank, floating = false }: { rank: number; floating?: boolean }) {
  const style = getRankStyle(rank);
  const isFirst = rank === 0;

  return (
    <div
      className={`flex items-center gap-1 rounded-full bg-gradient-to-br px-2.5 py-1 text-[10px] font-black shadow-lg ${style} ${
        floating ? "absolute -top-2.5 start-4 z-20 ring-2 ring-white" : ""
      }`}
    >
      {isFirst ? <Trophy className="h-3 w-3 shrink-0" /> : <Flame className="h-3 w-3 shrink-0 opacity-80" />}
      <span>#{rank + 1}</span>
      {isFirst && <span>الأوّل</span>}
    </div>
  );
}

export function BestSellingCarousel({ products, pricingAccount }: BestSellingCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pausedUntil = useRef(0);
  const count = products.length;

  const goTo = useCallback(
    (next: number) => {
      if (count <= 0) return;
      setActiveIndex(((next % count) + count) % count);
      pausedUntil.current = Date.now() + 8000;
    },
    [count]
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [goTo, activeIndex]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [goTo, activeIndex]);

  useEffect(() => {
    setActiveIndex(0);
    setDragPx(0);
  }, [products]);

  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(() => {
      if (Date.now() < pausedUntil.current || isDragging) return;
      goTo(activeIndex + 1);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count, activeIndex, goTo, isDragging]);

  const getEffective = (product: TieredProduct) =>
    getEffectivePrice(
      {
        price: product.price,
        priceRetail: product.priceRetail,
        priceWholesale: product.priceWholesale,
        priceReparateur: product.priceReparateur,
      },
      pricingAccount
    );

  const finishDrag = useCallback(
    (delta: number) => {
      setIsDragging(false);
      setDragPx(0);
      if (Math.abs(delta) < SWIPE_THRESHOLD || count <= 1) return;
      if (delta > 0) goPrev();
      else goNext();
    },
    [count, goNext, goPrev]
  );

  return (
    <>
      {/* جوال: coverflow ثلاثي الأبعاد */}
      <div className="relative -mx-4 sm:hidden">
        <div className="pointer-events-none absolute inset-x-6 top-8 h-48 rounded-full bg-gradient-to-b from-amber-200/30 via-orange-100/20 to-transparent blur-2xl" />

        <div
          ref={containerRef}
          className="relative mx-auto px-2"
          aria-label="الأكثر مبيعاً"
          style={{ perspective: "1400px", perspectiveOrigin: "50% 42%" }}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0]?.clientX ?? null;
            setIsDragging(true);
            pausedUntil.current = Date.now() + 10000;
          }}
          onTouchMove={(e) => {
            const start = touchStartX.current;
            const current = e.touches[0]?.clientX;
            if (start == null || current == null) return;
            setDragPx(current - start);
          }}
          onTouchEnd={(e) => {
            const start = touchStartX.current;
            const end = e.changedTouches[0]?.clientX;
            touchStartX.current = null;
            if (start == null || end == null) {
              setIsDragging(false);
              setDragPx(0);
              return;
            }
            finishDrag(end - start);
          }}
          onTouchCancel={() => {
            touchStartX.current = null;
            setIsDragging(false);
            setDragPx(0);
          }}
        >
          <div className="relative h-[418px] w-full overflow-visible [transform-style:preserve-3d]">
            {/* تدرجات الحواف */}
            <div
              className="pointer-events-none absolute inset-y-4 start-0 z-50 w-14 bg-gradient-to-l from-transparent via-white/40 to-white/95"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-4 end-0 z-50 w-14 bg-gradient-to-r from-transparent via-white/40 to-white/95"
              aria-hidden
            />

            {products.map((product, index) => {
              const offset = index - activeIndex;
              const motion = getCardMotion(offset, isDragging ? dragPx : 0);
              const isActive = offset === 0 && Math.abs(dragPx) < 20;

              return (
                <div
                  key={product.id}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} من ${count}: ${product.name}`}
                  aria-hidden={!isActive}
                  className={`absolute top-2 w-[78%] [backface-visibility:hidden] ${
                    isDragging ? "transition-none" : "transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  }`}
                  style={{
                    left: "50%",
                    transform: motion.transform,
                    opacity: motion.opacity,
                    zIndex: motion.zIndex,
                    pointerEvents: motion.pointerEvents,
                    filter: motion.filter,
                  }}
                  onClick={() => {
                    if (!isActive) goTo(index);
                  }}
                >
                  <div className="relative">
                    {isActive && (
                      <div
                        className="pointer-events-none absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-b from-amber-300/25 via-orange-200/10 to-transparent blur-xl"
                        aria-hidden
                      />
                    )}

                    <RankBadge rank={index} floating />

                    <ProductGridCard
                      product={product}
                      effectivePrice={getEffective(product)}
                      index={index}
                      priority={index === activeIndex}
                      imageSizes="78vw"
                      className={
                        isActive
                          ? "border-amber-300/70 shadow-[0_24px_56px_rgba(245,158,11,0.28)] ring-1 ring-amber-200/50"
                          : "cursor-pointer border-slate-200/40 shadow-[0_8px_24px_rgba(15,23,42,0.08)] saturate-[0.85]"
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {count > 1 && (
          <div className="relative mt-6 px-4">
            <div className="mb-4 flex items-center justify-center gap-1.5">
              {products.map((product, i) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`الانتقال إلى ${product.name}`}
                  aria-current={i === activeIndex ? "true" : undefined}
                  className={`rounded-full transition-all duration-500 ease-out ${
                    i === activeIndex
                      ? "h-2 w-8 bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_2px_8px_rgba(245,158,11,0.45)]"
                      : "h-2 w-2 bg-slate-300/80 hover:bg-slate-400"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goPrev}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/90 text-slate-600 shadow-[0_4px_16px_rgba(15,23,42,0.08)] backdrop-blur-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 active:scale-95"
                aria-label="المنتج السابق"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-600/80">
                  الأكثر مبيعاً
                </span>
                <p className="truncate text-center text-sm font-bold text-slate-800">
                  {products[activeIndex]?.name}
                </p>
                <span className="text-xs font-medium text-slate-400">
                  {activeIndex + 1} / {count}
                </span>
              </div>

              <button
                type="button"
                onClick={goNext}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/90 text-slate-600 shadow-[0_4px_16px_rgba(15,23,42,0.08)] backdrop-blur-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 active:scale-95"
                aria-label="المنتج التالي"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* شاشات أكبر */}
      <div className="hidden grid-cols-2 gap-3 sm:grid lg:grid-cols-4">
        {products.map((product, index) => (
          <div key={product.id} className="group relative">
            <div className="mb-3 flex justify-center">
              <RankBadge rank={index} />
            </div>
            <ProductGridCard
              product={product}
              effectivePrice={getEffective(product)}
              index={index}
              imageSizes="(max-width: 1024px) 50vw, 25vw"
              className={
                index === 0
                  ? "border-amber-200/80 shadow-[0_16px_40px_rgba(245,158,11,0.18)] hover:-translate-y-1.5 hover:border-amber-300 hover:shadow-[0_22px_48px_rgba(245,158,11,0.28)]"
                  : "hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_40px_rgba(37,99,235,0.16)]"
              }
            />
          </div>
        ))}
      </div>
    </>
  );
}
