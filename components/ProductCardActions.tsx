"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { AddToCartButton } from "@/components/AddToCartButton";
import { slugifyProductName } from "@/lib/seo";
import { getProductColorCircleStyle, getProductColorLabelAr } from "@/lib/productColors";

function inferProductType(category?: string): "phone" | "accessory" | "sparePart" {
  if (category === "قطع غيار") return "sparePart";
  if (category === "أكسسوارات" || category === "اكسسوارات") return "accessory";
  return "phone";
}

function isAccessoryCard(category?: string): boolean {
  const c = String(category || "").trim();
  return c === "أكسسوارات" || c === "اكسسوارات";
}

function colorKey(id: string) {
  return String(id || "").trim().toLowerCase();
}

export function ProductCardActions({
  id,
  name,
  price,
  image,
  colors,
  category,
}: {
  id: string;
  name: string;
  price: number;
  image: string;
  colors?: string[];
  category?: string;
}) {
  const colorsFingerprint = useMemo(() => {
    if (!Array.isArray(colors) || !colors.length) return "";
    return colors
      .slice(0, 8)
      .map((c) => String(c))
      .join("|");
  }, [colors]);

  const list = useMemo(() => {
    if (!Array.isArray(colors) || !colors.length) return [];
    return colors.slice(0, 8);
  }, [colorsFingerprint]);

  const [selectedColor, setSelectedColor] = useState<string>(list[0] || "");

  useEffect(() => {
    if (!list.length) {
      setSelectedColor("");
      return;
    }
    setSelectedColor((prev) => {
      const p = colorKey(prev);
      const found = list.find((c) => colorKey(c) === p);
      return found != null ? String(found) : String(list[0]);
    });
  }, [id, colorsFingerprint, list]);

  const pt = inferProductType(category);
  const selectedKey = colorKey(selectedColor);

  return (
    <>
      {/* ألوان البطاقة: مظهر هادئ، حدود رفيعة، تمييز بسيط للمحدد */}
      {list.length > 0 ? (
        <div
          className="mb-2.5 flex flex-wrap items-center justify-center gap-2 sm:mb-3 sm:gap-2"
          role="group"
          aria-label="الألوان المتوفرة"
        >
          {list.map((colorId) => {
            const isOn = colorKey(colorId) === selectedKey;
            const ck = colorKey(colorId);
            return (
              <button
                key={colorId}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedColor(colorId);
                }}
                title={getProductColorLabelAr(colorId)}
                aria-pressed={isOn}
                className={`touch-manipulation rounded-full p-1 transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35 focus-visible:ring-offset-1 focus-visible:ring-offset-white ${
                  isOn ? "bg-blue-50/70" : "bg-transparent hover:bg-slate-50"
                }`}
              >
                <span
                  className={`block h-3.5 w-3.5 rounded-full shadow-[0_1px_2px_rgba(15,23,42,0.06)] sm:h-4 sm:w-4 ${
                    isOn
                      ? "border-2 border-blue-600"
                      : "border border-slate-200/95"
                  }`}
                  style={{
                    ...getProductColorCircleStyle(colorId),
                    boxShadow:
                      ck === "white" || ck === "cream"
                        ? "inset 0 0 0 1px rgba(0,0,0,0.12), 0 1px 2px rgba(15,23,42,0.05)"
                        : undefined,
                  }}
                />
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-auto flex w-full flex-col gap-2">
        <AddToCartButton
          id={id}
          name={name}
          price={price}
          image={image}
          colors={list}
          lockColorToSelection={list.length > 0}
          lockedColor={selectedColor}
          productType={pt}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-900/20 transition-all hover:from-blue-600 hover:to-blue-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        >
          <ShoppingCart className="h-3.5 w-3.5" strokeWidth={2} />
          أضف للسلة
        </AddToCartButton>
        {!isAccessoryCard(category) ? (
          <Link
            href={`/product/${id}/${slugifyProductName(name)}`}
            className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50/60 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1 sm:py-3"
          >
            التفاصيل
          </Link>
        ) : null}
      </div>
    </>
  );
}
