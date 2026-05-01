"use client";

import { getProductColorCircleStyle, getProductColorLabelAr } from "@/lib/productColors";

type Props = {
  colorIds: string[];
  value: string;
  onChange: (id: string) => void;
  size?: "sm" | "md";
  className?: string;
};

const sizes = {
  sm: "h-7 w-7",
  md: "h-10 w-10",
};

export function ProductColorSwatches({
  colorIds,
  value,
  onChange,
  size = "md",
  className = "",
}: Props) {
  const dim = sizes[size];
  const v = String(value || "").toLowerCase();

  if (!colorIds?.length) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`} role="listbox" aria-label="اختيار اللون">
      {colorIds.map((cid) => {
        const id = String(cid).toLowerCase();
        const selected = v === id;
        return (
          <button
            key={cid}
            type="button"
            role="option"
            aria-selected={selected}
            title={getProductColorLabelAr(cid)}
            onClick={() => onChange(id)}
            className={`rounded-full p-0.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
              selected ? "ring-2 ring-blue-600 ring-offset-2" : "ring-2 ring-transparent hover:ring-slate-300"
            }`}
          >
            <span
              className={`block ${dim} rounded-full border border-slate-200 shadow-inner`}
              style={{
                ...getProductColorCircleStyle(cid),
                boxShadow:
                  id === "white" || id === "cream"
                    ? "inset 0 0 0 1px rgba(0,0,0,0.12)"
                    : undefined,
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
