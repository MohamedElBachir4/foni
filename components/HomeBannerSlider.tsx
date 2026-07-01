"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getProductImageUrl } from "@/lib/productImage";

type Banner = {
  _id: string;
  image: string;
  buttonText?: string;
  buttonUrl?: string;
  isFirstSlide?: boolean;
};

const AUTOPLAY_MS = 5000;

function normalizeBannerHref(url: string): string {
  const raw = String(url || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("/")) return raw;
  return `/${raw.replace(/^\/+/, "")}`;
}

function getBannerCta(banner: Banner, slideIndex: number): { text: string; href: string } {
  if (slideIndex === 0 || banner.isFirstSlide) {
    return { text: "فتح حساب", href: "/accounts" };
  }
  return {
    text: String(banner.buttonText || "").trim(),
    href: normalizeBannerHref(banner.buttonUrl || ""),
  };
}

function BannerCtaButton({ banner, slideIndex }: { banner: Banner; slideIndex: number }) {
  const { text, href } = getBannerCta(banner, slideIndex);
  if (!text || !href) return null;

  const className =
    "relative z-30 rounded-xl border border-blue-300/60 bg-gradient-to-r from-blue-700/95 to-blue-900/95 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-950/50 backdrop-blur-sm transition hover:from-blue-600 hover:to-blue-800 sm:px-7 sm:py-3 sm:text-base";

  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {text}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {text}
    </Link>
  );
}

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
        className="relative h-48 w-full sm:h-[26rem] lg:h-[32rem]"
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
            className={`absolute inset-0 flex flex-col transition-opacity duration-700 ease-in-out ${
              i === index ? "z-[1] opacity-100" : "pointer-events-none z-0 opacity-0"
            }`}
            aria-hidden={i !== index}
          >
            <div className="relative z-0 flex h-full w-full items-center justify-center bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getProductImageUrl(banner.image)}
                alt=""
                className="max-h-full max-w-full object-contain object-center"
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-center px-4 pb-12 sm:pb-16">
              <BannerCtaButton banner={banner} slideIndex={i} />
            </div>
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

            <div className="absolute inset-x-0 bottom-3 z-20 flex items-center justify-center gap-2 sm:bottom-5">
              {banners.map((banner, i) => (
                <button
                  key={banner._id}
                  type="button"
                  onClick={() => goTo(i)}
                  className={`h-2 rounded-full shadow-sm transition-all ${
                    i === index ? "w-7 bg-white" : "w-2 bg-white/80 hover:bg-white"
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
