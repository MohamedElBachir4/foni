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
const SWIPE_THRESHOLD = 42;
const SNAP_DURATION_MS = 720;

const RANK_STYLES = [
  "from-amber-400 via-yellow-300 to-amber-500 text-amber-950 shadow-amber-400/40",
  "from-slate-300 via-slate-100 to-slate-400 text-slate-800 shadow-slate-400/30",
  "from-orange-400 via-amber-300 to-orange-500 text-orange-950 shadow-orange-400/30",
  "from-blue-500 via-blue-400 to-indigo-500 text-white shadow-blue-400/30",
] as const;

function getRankStyle(rank: number) {
  return RANK_STYLES[Math.min(rank, RANK_STYLES.length - 1)]!;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(t: number) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

type CardMotion = {
  transform: string;
  opacity: number;
  zIndex: number;
  pointerEvents: "auto" | "none";
};

function getCardMotion(cardIndex: number, position: number): CardMotion {
  const adjusted = cardIndex - position;
  const abs = Math.abs(adjusted);
  const proximity = smoothstep(Math.min(1, abs));

  const scale = 1 - 0.22 * proximity;
  const opacity =
    abs > 2.1 ? 0 : clamp(1 - 0.5 * smoothstep(Math.min(1, abs * 0.92)), 0.12, 1);
  const translateZ = 56 - 138 * proximity;
  const rotateY = adjusted * 13;
  const zIndex = Math.round(40 - abs * 10);

  return {
    transform: `translate3d(calc(-50% - ${adjusted * 52}%), 0, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
    opacity,
    zIndex: clamp(zIndex, 0, 40),
    pointerEvents: abs < 0.55 ? "auto" : abs < 1.05 ? "auto" : "none",
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
  const [position, setPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const dragStartPosition = useRef(0);
  const slideWidthRef = useRef(300);
  const containerRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const pausedUntil = useRef(0);
  const count = products.length;

  const syncPosition = useCallback((value: number) => {
    positionRef.current = value;
    setPosition(value);
  }, []);

  const measureSlideWidth = useCallback(() => {
    const width = containerRef.current?.clientWidth ?? 0;
    if (width > 0) slideWidthRef.current = width * 0.72;
  }, []);

  useEffect(() => {
    measureSlideWidth();
    window.addEventListener("resize", measureSlideWidth);
    return () => window.removeEventListener("resize", measureSlideWidth);
  }, [measureSlideWidth]);

  const cancelAnimation = useCallback(() => {
    if (animFrameRef.current != null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsAnimating(false);
  }, []);

  const animateTo = useCallback(
    (targetIndex: number) => {
      if (count <= 0) return;
      const target = clamp(targetIndex, 0, count - 1);
      cancelAnimation();

      const start = positionRef.current;
      const startTime = performance.now();
      setIsAnimating(true);

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = clamp(elapsed / SNAP_DURATION_MS, 0, 1);
        const eased = easeOutCubic(progress);
        const current = start + (target - start) * eased;

        syncPosition(current);

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(tick);
        } else {
          animFrameRef.current = null;
          setIsAnimating(false);
          setActiveIndex(target);
          syncPosition(target);
        }
      };

      animFrameRef.current = requestAnimationFrame(tick);
    },
    [cancelAnimation, count, syncPosition]
  );

  const goTo = useCallback(
    (next: number) => {
      if (count <= 0) return;
      const target = ((next % count) + count) % count;
      pausedUntil.current = Date.now() + 8000;
      animateTo(target);
    },
    [animateTo, count]
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [goTo, activeIndex]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [goTo, activeIndex]);

  useEffect(() => {
    cancelAnimation();
    setActiveIndex(0);
    syncPosition(0);
  }, [products, cancelAnimation, syncPosition]);

  useEffect(() => () => cancelAnimation(), [cancelAnimation]);

  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(() => {
      if (Date.now() < pausedUntil.current || isDragging || isAnimating) return;
      goTo(activeIndex + 1);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count, activeIndex, goTo, isDragging, isAnimating]);

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
      touchStartX.current = null;

      if (count <= 1) {
        animateTo(activeIndex);
        return;
      }

      let target = Math.round(positionRef.current);
      if (Math.abs(delta) >= SWIPE_THRESHOLD) {
        target = delta > 0 ? target - 1 : target + 1;
      }

      target = clamp(target, 0, count - 1);
      pausedUntil.current = Date.now() + 8000;
      animateTo(target);
    },
    [activeIndex, animateTo, count]
  );

  const nearestActive = Math.round(position);
  const displayIndex = clamp(nearestActive, 0, Math.max(0, count - 1));
  const isCardActive = (index: number) => index === nearestActive && !isDragging && !isAnimating;

  return (
    <>
      <div className="relative -mx-4 sm:hidden">
        <div className="pointer-events-none absolute inset-x-6 top-8 h-48 rounded-full bg-gradient-to-b from-amber-200/30 via-orange-100/20 to-transparent blur-2xl" />

        <div
          ref={containerRef}
          className="relative mx-auto touch-pan-y px-2"
          aria-label="الأكثر مبيعاً"
          style={{ perspective: "1200px", perspectiveOrigin: "50% 44%" }}
          onTouchStart={(e) => {
            cancelAnimation();
            measureSlideWidth();
            touchStartX.current = e.touches[0]?.clientX ?? null;
            dragStartPosition.current = positionRef.current;
            setIsDragging(true);
            pausedUntil.current = Date.now() + 10000;
          }}
          onTouchMove={(e) => {
            const start = touchStartX.current;
            const current = e.touches[0]?.clientX;
            if (start == null || current == null || count <= 1) return;

            const delta = current - start;
            const slideWidth = Math.max(slideWidthRef.current, 220);
            const next = dragStartPosition.current - delta / slideWidth;
            syncPosition(clamp(next, -0.35, count - 1 + 0.35));
          }}
          onTouchEnd={(e) => {
            const start = touchStartX.current;
            const end = e.changedTouches[0]?.clientX;
            if (start == null || end == null) {
              setIsDragging(false);
              animateTo(activeIndex);
              return;
            }
            finishDrag(end - start);
          }}
          onTouchCancel={() => {
            setIsDragging(false);
            touchStartX.current = null;
            animateTo(activeIndex);
          }}
        >
          <div className="relative h-[418px] w-full overflow-visible [transform-style:preserve-3d]">
            <div
              className="pointer-events-none absolute inset-y-4 start-0 z-50 w-12 bg-gradient-to-l from-transparent to-white/90"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-4 end-0 z-50 w-12 bg-gradient-to-r from-transparent to-white/90"
              aria-hidden
            />

            {products.map((product, index) => {
              const motion = getCardMotion(index, position);
              const isActive = isCardActive(index);
              const isNearActive = Math.abs(index - position) < 0.55;

              return (
                <div
                  key={product.id}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} من ${count}: ${product.name}`}
                  aria-hidden={!isNearActive}
                  className="absolute top-2 w-[78%] [backface-visibility:hidden] [transform-style:preserve-3d] will-change-transform"
                  style={{
                    left: "50%",
                    transform: motion.transform,
                    opacity: motion.opacity,
                    zIndex: motion.zIndex,
                    pointerEvents: motion.pointerEvents,
                    transition:
                      isDragging || isAnimating
                        ? "none"
                        : "transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.55s ease",
                  }}
                  onClick={() => {
                    if (!isNearActive) goTo(index);
                  }}
                >
                  <div className="relative">
                    {isNearActive && (
                      <div
                        className="pointer-events-none absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-b from-amber-300/20 via-orange-200/10 to-transparent blur-xl transition-opacity duration-500"
                        style={{ opacity: isActive ? 1 : 0.35 }}
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
                      className={`transition-[box-shadow,border-color,filter] duration-500 ${
                        isNearActive
                          ? "border-amber-300/70 shadow-[0_24px_56px_rgba(245,158,11,0.28)] ring-1 ring-amber-200/50"
                          : "cursor-pointer border-slate-200/40 shadow-[0_8px_24px_rgba(15,23,42,0.08)] saturate-[0.88]"
                      }`}
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
                  aria-current={i === displayIndex ? "true" : undefined}
                  className={`rounded-full transition-all duration-500 ease-out ${
                    i === displayIndex
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
                <p className="truncate text-center text-sm font-bold text-slate-800 transition-opacity duration-300">
                  {products[displayIndex]?.name}
                </p>
                <span className="text-xs font-medium text-slate-400">
                  {displayIndex + 1} / {count}
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
