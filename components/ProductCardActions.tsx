"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { AddToCartButton } from "@/components/AddToCartButton";

const COLOR_HEX: Record<string, string> = {
    white: "#ffffff",
    black: "#1f2937",
    gold: "#d4af37",
    silver: "#c0c0c0",
    purple: "#7c3aed",
    red: "#dc2626",
    blue: "#2563eb",
    green: "#16a34a",
    gray: "#6b7280",
    brown: "#92400e",
};

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
    const [selectedColor, setSelectedColor] = useState<string>(
        colors && colors.length > 0 ? colors[0] : ""
    );

    return (
        <>
            <div className="mb-2 flex min-h-[28px] flex-wrap items-center justify-center gap-1.5">
                {colors && colors.length > 0
                    ? colors.slice(0, 5).map((colorId) => (
                        <button
                            key={colorId}
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                setSelectedColor(colorId);
                            }}
                            className={`inline-block h-4 w-4 shrink-0 rounded-full sm:h-5 sm:w-5 transition-transform ${selectedColor === colorId
                                ? "border-[2.5px] border-blue-600 scale-125 ring-2 ring-blue-600 ring-offset-1"
                                : "border border-slate-200 hover:scale-110"
                                }`}
                            style={{
                                backgroundColor: COLOR_HEX[colorId] || "#9ca3af",
                                boxShadow: colorId === "white" && selectedColor !== colorId ? "inset 0 0 0 1px rgba(0,0,0,0.1)" : undefined,
                            }}
                            title={colorId}
                        />
                    ))
                    : null}
            </div>

            <div className="mt-auto flex flex-col gap-2">
                <AddToCartButton
                    id={id}
                    name={name}
                    price={price}
                    image={image}
                    selectedColor={selectedColor}
                    productType={category === "هواتف" ? "phone" : undefined}
                    className="flex w-full items-center justify-center gap-1.5 rounded-full bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                >
                    <ShoppingCart className="h-3.5 w-3.5" strokeWidth={2} />
                    أضف للسلة
                </AddToCartButton>
                <Link
                    href={`/product/${id}`}
                    className="flex w-full items-center justify-center rounded-full border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1 sm:py-3"
                >
                    التفاصيل
                </Link>
            </div>
        </>
    );
}
