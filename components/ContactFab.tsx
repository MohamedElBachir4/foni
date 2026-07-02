"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Phone, X } from "lucide-react";
import { SiMessenger, SiWhatsapp } from "react-icons/si";

type ContactItem = {
  id: "whatsapp" | "phone" | "messenger" | string;
  label: string;
  href: string;
  external: boolean;
};

const ITEM_META: Record<
  string,
  { icon: ReactNode; ring: string; bg: string; hover: string }
> = {
  whatsapp: {
    icon: <SiWhatsapp className="h-5 w-5" />,
    ring: "ring-[#25D366]/30",
    bg: "bg-[#25D366]",
    hover: "hover:bg-[#1fb85a]",
  },
  phone: {
    icon: <Phone className="h-5 w-5" />,
    ring: "ring-sky-400/30",
    bg: "bg-sky-600",
    hover: "hover:bg-sky-700",
  },
  messenger: {
    icon: <SiMessenger className="h-5 w-5" />,
    ring: "ring-[#0084FF]/30",
    bg: "bg-[#0084FF]",
    hover: "hover:bg-[#0073e6]",
  },
};

export function ContactFab() {
  const pathname = usePathname();
  const [items, setItems] = useState<ContactItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/contact-settings/public", { credentials: "include" });
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        if (!cancelled) {
          setItems(Array.isArray(data.items) ? data.items : []);
        }
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const root = rootRef.current;
      if (root && !root.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open, close]);

  if (pathname.startsWith("/admin")) return null;
  if (!loaded || items.length === 0) return null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            aria-label="إغلاق قائمة التواصل"
            className="fixed inset-0 z-[1390] bg-slate-900/20 backdrop-blur-[1px] sm:bg-transparent sm:backdrop-blur-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
        )}
      </AnimatePresence>

      <div ref={rootRef} className="fixed bottom-5 right-5 z-[1400] sm:bottom-6 sm:right-6">
        <AnimatePresence>
          {open && (
            <motion.div
              role="menu"
              aria-label="وسائل التواصل"
              className="absolute bottom-full right-0 mb-3 flex min-w-[13.5rem] flex-col gap-2 rounded-2xl border border-white/60 bg-white/95 p-2 shadow-2xl shadow-slate-900/15 ring-1 ring-slate-200/80 backdrop-blur-xl"
              initial={{ opacity: 0, y: 10, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
            >
              {items.map((item, i) => {
                const meta =
                  ITEM_META[item.id] ||
                  (item.id.startsWith("whatsapp") ? ITEM_META.whatsapp : ITEM_META.phone);
                return (
                  <motion.a
                    key={item.id}
                    role="menuitem"
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    onClick={close}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 ${meta.ring}`}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <span
                      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-md ${meta.bg} ${meta.hover}`}
                    >
                      {meta.icon}
                    </span>
                    <span>{item.label}</span>
                  </motion.a>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          aria-label={open ? "إغلاق التواصل" : "تواصل معنا"}
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 text-white shadow-xl shadow-blue-600/35 transition hover:scale-105 hover:shadow-2xl hover:shadow-blue-600/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
          whileTap={{ scale: 0.96 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={open ? "close" : "open"}
              initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="inline-flex"
            >
              {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  );
}
