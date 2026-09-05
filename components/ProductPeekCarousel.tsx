"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Flame, Trophy } from "lucide-react";
import { type Product } from "@/lib/productsData";
import { ProductGridCard } from "@/components/ProductGridCard";
import { getEffectivePrice } from "@/lib/pricing";
import type { AccountInfo } from "@/context/AccountContext";

export type TieredProduct = Product & {
  colors?: string[];
  priceRetail?: number;
  priceWholesale?: number;
  priceReparateur?: number;
};

export type ProductPeekVariant = "latest" | "bestSelling";

export type PeekRenderCardOptions = {
  index: number;
  compact: boolean;
  className: string;
  isNearActive: boolean;
  isActive: boolean;
  theme: (typeof VARIANT_THEME)[ProductPeekVariant];
};

type ProductPeekCarouselProps = {
  products: TieredProduct[];
  pricingAccount: AccountInfo | null;
  variant: ProductPeekVariant;
  sectionLabel: string;
  ariaLabel: string;
  showRankBadges?: boolean;
  className?: string;
  renderCard?: (product: TieredProduct, options: PeekRenderCardOptions) => React.ReactNode;
};

const AUTOPLAY_MS = 5500;
const SWIPE_THRESHOLD = 28;
const VELOCITY_THRESHOLD = 0.45; // px/ms
const SNAP_DURATION_MS = 480;

const RANK_STYLES = [
  "from-amber-400 via-yellow-300 to-amber-500 text-amber-950 shadow-amber-400/40",
  "from-slate-300 via-slate-100 to-slate-400 text-slate-800 shadow-slate-400/30",
  "from-orange-400 via-amber-300 to-orange-500 text-orange-950 shadow-orange-400/30",
  "from-blue-500 via-blue-400 to-indigo-500 text-white shadow-blue-400/30",
] as const;

const VARIANT_THEME = {
  bestSelling: {
    ambient: "from-amber-200/30 via-orange-100/20",
    cardGlow: "from-amber-300/20 via-orange-200/10",
    activeCard:
      "border-amber-300/70 shadow-[0_24px_56px_rgba(245,158,11,0.28)] ring-1 ring-amber-200/50",
    dotActive: "from-amber-500 to-orange-400",
    dotShadow: "shadow-[0_2px_8px_rgba(245,158,11,0.45)]",
    label: "text-amber-600/80",
    navHover: "hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700",
  },
  latest: {
    ambient: "from-blue-200/35 via-indigo-100/20",
    cardGlow: "from-blue-300/20 via-indigo-200/10",
    activeCard:
      "border-blue-300/70 shadow-[0_24px_56px_rgba(37,99,235,0.24)] ring-1 ring-blue-200/50",
    dotActive: "from-blue-600 to-blue-400",
    dotShadow: "shadow-[0_2px_8px_rgba(37,99,235,0.4)]",
    label: "text-blue-600/80",
    navHover: "hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700",
  },
} as const;

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

function easeOutQuint(t: number) {
  return 1 - Math.pow(1 - t, 5);
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

  const scale = 1 - 0.18 * proximity;
  const opacity =
    abs > 2.1 ? 0 : clamp(1 - 0.45 * smoothstep(Math.min(1, abs * 0.88)), 0.18, 1);
  const translateZ = 48 - 120 * proximity;
  const rotateY = adjusted * 9;
  const zIndex = Math.round(40 - abs * 10);

  return {
    transform: `translate3d(calc(-50% - ${adjusted * 38}%), 0, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
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

export function ProductPeekCarousel({
  products,
  pricingAccount,
  variant,
  sectionLabel,
  ariaLabel,
  showRankBadges = false,
  className = "",
  renderCard,
}: ProductPeekCarouselProps) {
  const theme = VARIANT_THEME[variant];
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
  const dragRafRef = useRef<number | null>(null);
  const pendingDragPos = useRef<number | null>(null);
  const lastTouchX = useRef(0);
  const lastTouchTime = useRef(0);
  const velocityRef = useRef(0);
  const pausedUntil = useRef(0);
  const count = products.length;

  const syncPosition = useCallback((value: number) => {
    positionRef.current = value;
    setPosition(value);
  }, []);

  const scheduleDragPosition = useCallback(
    (value: number) => {
      pendingDragPos.current = value;
      if (dragRafRef.current != null) return;
      dragRafRef.current = requestAnimationFrame(() => {
        dragRafRef.current = null;
        if (pendingDragPos.current != null) {
          syncPosition(pendingDragPos.current);
        }
      });
    },
    [syncPosition]
  );

  const measureSlideWidth = useCallback(() => {
    const width = containerRef.current?.clientWidth ?? 0;
    if (width > 0) slideWidthRef.current = width * 0.64;
  }, []);

  useEffect(() => {
    measureSlideWidth();
    window.addEventListener("resize", measureSlideWidth);
    return () => window.removeEventListener("resize", measureSlideWidth);
  }, [measureSlideWidth]);

  // مستمع غير سلبي للسحب الأفقي السلس دون تعطيل تمرير الصفحة العمودي
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onMove = (e: TouchEvent) => {
      const start = touchStartX.current;
      const current = e.touches[0]?.clientX;
      if (start == null || current == null || products.length <= 1) return;

      const now = performance.now();
      const dt = Math.max(now - lastTouchTime.current, 1);
      velocityRef.current = (current - lastTouchX.current) / dt;
      lastTouchX.current = current;
      lastTouchTime.current = now;

      const delta = current - start;
      if (Math.abs(delta) > 8) {
        e.preventDefault();
      }

      const slideWidth = Math.max(slideWidthRef.current, 220);
      let next = dragStartPosition.current - delta / slideWidth;
      const last = products.length - 1;

      if (next < 0) next *= 0.28;
      else if (next > last) next = last + (next - last) * 0.28;

      scheduleDragPosition(next);
    };

    el.addEventListener("touchmove", onMove, { passive: false });
    return () => el.removeEventListener("touchmove", onMove);
  }, [products.length, scheduleDragPosition]);

  const cancelAnimation = useCallback(() => {
    if (animFrameRef.current != null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (dragRafRef.current != null) {
      cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }
    setIsAnimating(false);
  }, []);

  const animateTo = useCallback(
    (targetIndex: number, durationMs = SNAP_DURATION_MS) => {
      if (count <= 0) return;
      const target = clamp(targetIndex, 0, count - 1);
      cancelAnimation();

      const start = positionRef.current;
      if (Math.abs(start - target) < 0.001) {
        setActiveIndex(target);
        syncPosition(target);
        return;
      }

      const startTime = performance.now();
      setIsAnimating(true);

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = clamp(elapsed / durationMs, 0, 1);
        const eased = easeOutQuint(progress);
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

      const velocity = velocityRef.current;
      let target = Math.round(positionRef.current);

      if (Math.abs(velocity) >= VELOCITY_THRESHOLD) {
        // سرعة السحب تحدد الاتجاه (يمين → السابق، يسار → التالي)
        target = velocity > 0 ? Math.floor(positionRef.current) : Math.ceil(positionRef.current);
        if (Math.abs(velocity) > 0.9) {
          target = velocity > 0 ? target - 1 : target + 1;
        }
      } else if (Math.abs(delta) >= SWIPE_THRESHOLD) {
        target = delta > 0 ? Math.floor(positionRef.current) : Math.ceil(positionRef.current);
      }

      target = clamp(target, 0, count - 1);
      const distance = Math.abs(positionRef.current - target);
      const duration = clamp(280 + distance * 180, 280, 520);
      pausedUntil.current = Date.now() + 8000;
      velocityRef.current = 0;
      animateTo(target, duration);
    },
    [activeIndex, animateTo, count]
  );

  const nearestActive = Math.round(position);
  const displayIndex = clamp(nearestActive, 0, Math.max(0, count - 1));
  const isCardActive = (index: number) => index === nearestActive && !isDragging && !isAnimating;

  if (count === 0) return null;

  return (
    <div className={`relative -mx-4 ${className}`}>
      <div
        className={`pointer-events-none absolute inset-x-6 top-8 h-48 rounded-full bg-gradient-to-b ${theme.ambient} to-transparent blur-2xl`}
      />

      <div
        ref={containerRef}
        className="relative mx-auto px-2"
        aria-label={ariaLabel}
        style={{
          perspective: "1200px",
          perspectiveOrigin: "50% 44%",
          touchAction: "pan-y",
          WebkitUserSelect: "none",
          userSelect: "none",
        }}
        onTouchStart={(e) => {
          cancelAnimation();
          measureSlideWidth();
          const x = e.touches[0]?.clientX ?? null;
          touchStartX.current = x;
          if (x != null) {
            lastTouchX.current = x;
            lastTouchTime.current = performance.now();
          }
          velocityRef.current = 0;
          dragStartPosition.current = positionRef.current;
          setIsDragging(true);
          pausedUntil.current = Date.now() + 10000;
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
          velocityRef.current = 0;
          animateTo(activeIndex);
        }}
      >
        <div className="relative h-[290px] w-full overflow-visible [transform-style:preserve-3d]">
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
                className="absolute top-2 w-[56%] [backface-visibility:hidden] [transform-style:preserve-3d] will-change-transform"
                style={{
                  left: "50%",
                  transform: motion.transform,
                  opacity: motion.opacity,
                  zIndex: motion.zIndex,
                  pointerEvents: motion.pointerEvents,
                  transition:
                    isDragging || isAnimating
                      ? "none"
                      : "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease",
                }}
                onClick={() => {
                  if (!isNearActive) goTo(index);
                }}
              >
                <div className="relative">
                  {isNearActive && (
                    <div
                      className={`pointer-events-none absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-b ${theme.cardGlow} to-transparent blur-xl transition-opacity duration-500`}
                      style={{ opacity: isActive ? 1 : 0.35 }}
                      aria-hidden
                    />
                  )}

                  {showRankBadges && <RankBadge rank={index} floating />}

                  {renderCard ? (
                    renderCard(product, {
                      index,
                      compact: true,
                      className: `transition-[box-shadow,border-color,filter] duration-500 ${
                        isNearActive
                          ? theme.activeCard
                          : "cursor-pointer border-slate-200/40 shadow-[0_8px_24px_rgba(15,23,42,0.08)] saturate-[0.88]"
                      }`,
                      isNearActive,
                      isActive,
                      theme,
                    })
                  ) : (
                    <ProductGridCard
                      product={product}
                      effectivePrice={getEffective(product)}
                      index={index}
                      priority={index === activeIndex}
                      compact
                      imageSizes="68vw"
                      className={`transition-[box-shadow,border-color,filter] duration-500 ${
                        isNearActive
                          ? theme.activeCard
                          : "cursor-pointer border-slate-200/40 shadow-[0_8px_24px_rgba(15,23,42,0.08)] saturate-[0.88]"
                      }`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {count > 1 && (
        <div className="relative mt-1 px-3">
          {/* نقاط المؤشر */}
          <div className="mb-1 flex items-center justify-center gap-1">
            {products.map((product, i) => (
              <button
                key={product.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`الانتقال إلى ${product.name}`}
                aria-current={i === displayIndex ? "true" : undefined}
                className={`rounded-full transition-all duration-500 ease-out ${
                  i === displayIndex
                    ? `h-1.5 w-5 bg-gradient-to-r ${theme.dotActive} ${theme.dotShadow}`
                    : "h-1.5 w-1.5 bg-slate-300/80 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>

          {/* أزرار التنقل + اسم المنتج */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={goPrev}
              className={`flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/80 bg-white/90 text-slate-600 shadow-sm transition active:scale-95 ${theme.navHover}`}
              aria-label="المنتج السابق"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="flex min-w-0 flex-1 flex-col items-center gap-0">
              <p className="truncate text-center text-xs font-bold text-slate-800">
                {products[displayIndex]?.name}
              </p>
              <span className="text-[10px] font-medium text-slate-400">
                {displayIndex + 1} / {count}
              </span>
            </div>

            <button
              type="button"
              onClick={goNext}
              className={`flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/80 bg-white/90 text-slate-600 shadow-sm transition active:scale-95 ${theme.navHover}`}
              aria-label="المنتج التالي"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { RankBadge, getRankStyle };
