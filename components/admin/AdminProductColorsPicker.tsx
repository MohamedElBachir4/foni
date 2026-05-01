"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { PRODUCT_COLORS, getProductColorCircleStyle } from "@/lib/productColors";

type Props = {
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  variant?: "default" | "compact";
};

interface DropdownPos {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

export function AdminProductColorsPicker({
  value,
  onChange,
  disabled,
  variant = "default",
}: Props) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return PRODUCT_COLORS;
    return PRODUCT_COLORS.filter(
      (c) =>
        c.labelAr.toLowerCase().includes(n) ||
        c.id.replace(/_/g, " ").toLowerCase().includes(n) ||
        c.id.toLowerCase().includes(n)
    );
  }, [q]);

  function toggle(id: string) {
    if (disabled) return;
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  }

  const allIds = PRODUCT_COLORS.map((c) => c.id);

  /** إصدار قطع الغيار: قائمة منسدلة بحث متعددة */
  if (variant === "compact") {
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
    const [dropdownPos, setDropdownPos] = useState<DropdownPos | null>(null);

    useLayoutEffect(() => {
      setPortalEl(typeof document !== "undefined" ? document.body : null);
    }, []);

    const commitDropdownMeasure = () => {
      const el = triggerRef.current;
      if (!el || typeof window === "undefined") return;
      const r = el.getBoundingClientRect();
      const gap = 6;
      const minW = 260;
      const width = Math.max(r.width, minW);
      let left = r.left;
      const pad = 10;
      const vw =
        typeof window.visualViewport?.width === "number"
          ? window.visualViewport.width
          : window.innerWidth;
      const vh =
        typeof window.visualViewport?.height === "number"
          ? window.visualViewport.height
          : window.innerHeight;

      if (left + width > vw - pad) {
        left = Math.max(pad, vw - width - pad);
      }

      const belowGap = gap + pad;
      const spaceBelow = Math.max(0, vh - r.bottom - belowGap);
      const spaceAbove = Math.max(0, r.top - belowGap);

      /** أقصى ارتفاع للوحة؛ يجب أن يبقى داخل المنطقة الظاهرة فعلاً */
      const MAX_PANEL = 360;
      const minUsable = 96;

      const capBelow = Math.min(MAX_PANEL, spaceBelow);
      const capAbove = Math.min(MAX_PANEL, spaceAbove);

      const preferBelow =
        spaceBelow >= minUsable &&
        (spaceBelow >= spaceAbove || capBelow >= capAbove * 0.92);

      let top: number;
      let maxHeight: number;

      if (preferBelow) {
        top = r.bottom + gap;
        maxHeight = capBelow;
      } else if (capAbove >= minUsable) {
        maxHeight = capAbove;
        top = r.top - gap - maxHeight;
        if (top < pad) {
          maxHeight -= pad - top;
          top = pad;
          maxHeight = Math.max(minUsable * 0.75, Math.min(maxHeight, r.top - gap - pad));
        }
      } else {
        /** ضيق جداً: نستخدم الجهة الأعرض قائماً مع تقليل ضئيل لتفادي القصّ */
        if (spaceAbove >= spaceBelow) {
          maxHeight = Math.max(minUsable * 0.6, Math.min(capAbove, MAX_PANEL));
          top = Math.max(pad, r.top - gap - maxHeight);
        } else {
          top = r.bottom + gap;
          maxHeight = Math.max(minUsable * 0.6, Math.min(capBelow, MAX_PANEL));
        }
      }

      maxHeight = Math.round(Math.min(MAX_PANEL, Math.max(maxHeight, 72)));

      setDropdownPos({
        top,
        left,
        width,
        maxHeight,
      });
    };

    useLayoutEffect(() => {
      if (!open || !portalEl) {
        setDropdownPos(null);
        return;
      }
      commitDropdownMeasure();
      function onVp() {
        commitDropdownMeasure();
      }
      window.addEventListener("resize", onVp);
      window.addEventListener("scroll", onVp, true);
      const vv = window.visualViewport;
      vv?.addEventListener("resize", onVp);
      vv?.addEventListener("scroll", onVp);
      return () => {
        window.removeEventListener("resize", onVp);
        window.removeEventListener("scroll", onVp, true);
        vv?.removeEventListener("resize", onVp);
        vv?.removeEventListener("scroll", onVp);
      };
    }, [open, portalEl]);

    useEffect(() => {
      function onDoc(e: MouseEvent) {
        const t = e.target as Node;
        if (rootRef.current?.contains(t)) return;
        if (dropdownRef.current?.contains(t)) return;
        setOpen(false);
      }
      if (open) {
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
      }
    }, [open]);

    useEffect(() => {
      if (!open) setQ("");
    }, [open]);

    const summary =
      value.length === 0
        ? "اختر الألوان…"
        : value
            .slice(0, 2)
            .map((id) => PRODUCT_COLORS.find((c) => c.id === id)?.labelAr ?? id)
            .join("، ") + (value.length > 2 ? ` +${value.length - 2}` : "");

    const triggerClass =
      "admin-input flex h-7 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-slate-200/90 bg-white px-2 py-1 text-[11px] text-slate-800 shadow-[inset_0_1px_1px_rgba(15,23,42,.04)] focus-visible:border-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-100 disabled:opacity-45";

    const dropdown =
      open && portalEl && dropdownPos ? (
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[220] grid grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-900/8"
            style={{
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              maxHeight: dropdownPos.maxHeight,
            }}
            dir="rtl"
            role="listbox"
            aria-multiselectable
          >
            <div className="flex shrink-0 items-center gap-1 border-b border-slate-100 px-2 py-1">
              <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
              <input
                type="search"
                dir="auto"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="بحث…"
                autoComplete="off"
                className="min-w-0 flex-1 border-0 bg-transparent py-0.5 text-[11px] outline-none placeholder:text-slate-400"
                aria-label="تصفية الألوان"
                onMouseDown={(e) => e.stopPropagation()}
              />
            </div>
            <div className="flex shrink-0 flex-wrap gap-1 border-b border-slate-100 px-2 py-1">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange([...allIds])}
                className="rounded border border-emerald-200/80 bg-emerald-50/90 px-2 py-px text-[10px] font-medium text-emerald-900 hover:bg-white disabled:opacity-40"
              >
                الكل
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange([])}
                className="rounded border border-slate-200 bg-slate-50 px-2 py-px text-[10px] font-medium text-slate-700 hover:bg-white disabled:opacity-40"
              >
                لا شيء
              </button>
              <span className="ms-auto font-mono text-[10px] text-slate-500">
                {value.length}/{PRODUCT_COLORS.length}
              </span>
            </div>
            <ul className="min-h-0 overflow-y-auto overscroll-contain py-0.5 text-[11px]">
              {filtered.length === 0 ? (
                <li className="px-2 py-2 text-center text-[10px] text-slate-500">لا تطابق</li>
              ) : (
                filtered.map((c) => {
                  const on = value.includes(c.id);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={on}
                        disabled={disabled}
                        onClick={() => toggle(c.id)}
                        className={`flex w-full items-center gap-2 px-2 py-1.5 text-start transition hover:bg-slate-50 disabled:opacity-45 ${
                          on ? "bg-sky-50/95" : ""
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            on ? "border-sky-500 bg-sky-500 text-white" : "border-slate-300 bg-white"
                          }`}
                        >
                          {on ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
                        </span>
                        <span
                          className="h-[18px] w-[18px] shrink-0 rounded-full border border-slate-200 shadow-inner"
                          style={{
                            ...getProductColorCircleStyle(c.id),
                            boxShadow:
                              c.id === "white" || c.id === "cream"
                                ? "inset 0 0 0 1px rgba(0,0,0,0.1)"
                                : undefined,
                          }}
                        />
                        <span className="min-w-0 flex-1 truncate text-slate-800">{c.labelAr}</span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>,
          portalEl
        )
      ) : null;

    return (
      <div ref={rootRef} className="relative w-full min-w-0">
        {dropdown}
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="listbox"
          className={triggerClass}
          onClick={() => !disabled && setOpen((o) => !o)}
        >
          <span className={`min-w-0 flex-1 truncate text-start ${value.length === 0 ? "text-slate-500" : "text-slate-800"}`}>
            {summary}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "-rotate-180" : ""}`}
            aria-hidden
          />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="بحث في الألوان…"
        disabled={disabled}
        className="admin-input"
        dir="auto"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange([...allIds])}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          اختيار الكل
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange([])}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          إزالة الكل
        </button>
        <span className="mr-auto text-xs text-slate-600">
          مختار: {value.length} / {PRODUCT_COLORS.length}
        </span>
      </div>
      <div
        className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 sm:max-h-64"
        role="group"
        aria-label="الألوان المتوفرة"
      >
        <div className="grid gap-1 sm:grid-cols-2">
          {filtered.map((c) => {
            const on = value.includes(c.id);
            return (
              <label
                key={c.id}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-2 text-sm transition ${
                  on ? "border-sky-400 bg-sky-50/80" : "border-transparent hover:border-slate-200 hover:bg-slate-50/80"
                } ${disabled ? "pointer-events-none opacity-50" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(c.id)}
                  disabled={disabled}
                  className="h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span
                  className="h-6 w-6 shrink-0 rounded-full border border-slate-200 shadow-inner"
                  style={{
                    ...getProductColorCircleStyle(c.id),
                    boxShadow:
                      c.id === "white" || c.id === "cream"
                        ? "inset 0 0 0 1px rgba(0,0,0,0.12)"
                        : undefined,
                  }}
                />
                <span className="min-w-0 flex-1 text-slate-800">{c.labelAr}</span>
              </label>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-500">لا توجد ألوان مطابقة للبحث.</p>
        )}
      </div>
    </div>
  );
}
