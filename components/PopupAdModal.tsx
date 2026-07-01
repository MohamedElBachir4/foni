"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { getProductImageUrl } from "@/lib/productImage";

const STORAGE_KEY = "foni-popup-ad-dismissed";

type PopupAdData = {
  enabled: boolean;
  image: string;
  updatedAt?: string;
};

export function PopupAdModal() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [ad, setAd] = useState<PopupAdData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || pathname.startsWith("/admin")) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/popup-advertisements/public", { credentials: "include" });
        if (!res.ok) throw new Error("fetch failed");
        const data: PopupAdData = await res.json();
        if (cancelled) return;

        const image = String(data.image || "").trim();
        const enabled = Boolean(data.enabled) && Boolean(image);
        if (!enabled) {
          setAd(null);
          setVisible(false);
          return;
        }

        const version = data.updatedAt ? String(data.updatedAt) : image;
        const dismissed = sessionStorage.getItem(STORAGE_KEY);
        if (dismissed === version) {
          setAd({ enabled: true, image, updatedAt: data.updatedAt });
          setVisible(false);
          return;
        }

        setAd({ enabled: true, image, updatedAt: data.updatedAt });
        setVisible(true);
      } catch {
        if (!cancelled) {
          setAd(null);
          setVisible(false);
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mounted, pathname]);

  const dismiss = useCallback(() => {
    if (ad?.image) {
      const version = ad.updatedAt ? String(ad.updatedAt) : ad.image;
      try {
        sessionStorage.setItem(STORAGE_KEY, version);
      } catch {
        /* ignore */
      }
    }
    setVisible(false);
  }, [ad]);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, dismiss]);

  if (!mounted || !loaded || !ad?.image || !visible) return null;

  const imageSrc = getProductImageUrl(ad.image);

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[1500] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="إعلان"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.button
            type="button"
            aria-label="إغلاق الإعلان"
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
          />

          <motion.div
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-900/25 ring-1 ring-white/20 sm:max-w-2xl lg:max-w-3xl"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <button
              type="button"
              onClick={dismiss}
              aria-label="إغلاق"
              className="absolute start-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/70 text-white shadow-lg backdrop-blur-sm transition hover:bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:start-4 sm:top-4 sm:h-10 sm:w-10"
            >
              <X className="h-5 w-5" />
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt="إعلان"
              className="block h-auto max-h-[75vh] w-full object-contain"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
