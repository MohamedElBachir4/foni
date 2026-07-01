"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getProductImageUrl } from "@/lib/productImage";

type Banner = { _id: string; image: string };

const AUTOPLAY_MS = 5000;

export function HomeBannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/home/banners", { credentials: "include" });
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        if (!cancelled) {
          setBanners(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) setBanners([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const count = banners.length;

  const goTo = useCallback(
    (next: number) => {
      if (count <= 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(goNext, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count, goNext]);

  useEffect(() => {
    if (index >= count && count > 0) setIndex(0);
  }, [count, index]);

  if (loading) {
    return (
      <section className="relative mb-8 w-full overflow-hidden sm:mb-10">
        <div className="flex h-48 w-full animate-pulse items-center justify-center bg-slate-100 sm:h-[26rem] lg:h-[32rem]">
          <span className="text-sm text-slate-400">جاري التحميل...</span>
        </div>
      </section>
    );
  }

  if (count === 0) {
    return null;
  }

  return (
    <section
      className="relative mb-8 w-full overflow-hidden sm:mb-10"
      aria-label="سلايدر الصفحة الرئيسية"
    >
      <div
        className="relative h-48 w-full bg-slate-100 sm:h-[26rem] lg:h-[32rem]"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          const end = e.changedTouches[0]?.clientX;
          touchStartX.current = null;
          if (start == null || end == null) return;
          const delta = end - start;
          if (Math.abs(delta) < 40) return;
          if (delta > 0) goPrev();
          else goNext();
        }}
      >
        {banners.map((banner, i) => (
          <div
            key={banner._id}
            className={`absolute inset-0 flex items-center justify-center bg-slate-100 transition-opacity duration-700 ease-in-out ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-hidden={i !== index}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getProductImageUrl(banner.image)}
              alt=""
              className="h-full w-full object-contain object-center"
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
            />
          </div>
        ))}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55 sm:right-5 sm:h-11 sm:w-11"
              aria-label="الصورة السابقة"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55 sm:left-5 sm:h-11 sm:w-11"
              aria-label="الصورة التالية"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-2">
              {banners.map((banner, i) => (
                <button
                  key={banner._id}
                  type="button"
                  onClick={() => goTo(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === index ? "w-7 bg-white" : "w-2 bg-white/55 hover:bg-white/80"
                  }`}
                  aria-label={`الانتقال إلى الشريحة ${i + 1}`}
                  aria-current={i === index ? "true" : undefined}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
