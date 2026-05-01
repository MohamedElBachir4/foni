"use client";

import { useMemo, useState } from "react";
import { PRODUCT_COLORS, getProductColorCircleStyle } from "@/lib/productColors";

type Props = {
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

export function AdminProductColorsPicker({ value, onChange, disabled }: Props) {
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
                    boxShadow: c.id === "white" || c.id === "cream" ? "inset 0 0 0 1px rgba(0,0,0,0.12)" : undefined,
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
