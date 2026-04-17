"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Truck, ShoppingCart, Phone } from "lucide-react";
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

export function ProductDetailsClient({
    product,
    description
}: {
    product: any;
    description: string;
}) {
    const [selectedColor, setSelectedColor] = useState<string>(
        product.colors && product.colors.length > 0 ? product.colors[0] : ""
    );

    return (
        <>
            {product.colors && product.colors.length > 0 && (
                <div className="mb-4 sm:mb-6">
                    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:mb-2.5 sm:text-sm">
                        الألوان المتوفرة
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {product.colors.map((colorId: string) => (
                            <button
                                key={colorId}
                                onClick={() => setSelectedColor(colorId)}
                                className={`inline-block h-8 w-8 rounded-full shadow-sm sm:h-9 sm:w-9 transition-all ${selectedColor === colorId
                                        ? "border-2 border-blue-600 ring-2 ring-blue-600 ring-offset-2 scale-110"
                                        : "border-2 border-slate-200 hover:scale-105"
                                    }`}
                                style={{
                                    backgroundColor: COLOR_HEX[colorId] || "#9ca3af",
                                    boxShadow: colorId === "white" && selectedColor !== colorId ? "inset 0 0 0 1px rgba(0,0,0,0.1)" : undefined,
                                }}
                                title={colorId}
                                type="button"
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="mb-4 sm:mb-6">
                <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:mb-2 sm:text-sm">
                    الوصف
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 sm:text-base">
                    {description}
                </p>
            </div>

            <div className="mb-4 flex flex-wrap gap-2 sm:mb-6 sm:gap-3">
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 sm:gap-1.5 sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-xs">
                    <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.5} />
                    ضمان
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700 sm:gap-1.5 sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-xs">
                    <Truck className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.5} />
                    توصيل
                </span>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                <AddToCartButton
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    image={product.image}
                    selectedColor={selectedColor}
                    productType={product.category === "هواتف" ? "phone" : undefined}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-md active:scale-[0.98] sm:rounded-xl sm:bg-gradient-to-l sm:from-blue-600 sm:to-blue-500 sm:py-4 sm:shadow-lg sm:shadow-blue-500/30 sm:transition-all sm:duration-300 sm:hover:from-blue-500 sm:hover:to-blue-600 sm:hover:shadow-xl sm:hover:shadow-blue-500/40"
                >
                    <ShoppingCart className="h-5 w-5" strokeWidth={2.5} />
                    أضف للسلة
                </AddToCartButton>
                <Link
                    href="tel:+213000000000"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white py-3.5 font-bold text-slate-700 active:scale-[0.98] sm:rounded-xl sm:py-4 sm:transition-all sm:duration-300 sm:hover:border-blue-400 sm:hover:bg-blue-50 sm:hover:text-blue-600"
                >
                    <Phone className="h-5 w-5" strokeWidth={2.5} />
                    اطلب الآن
                </Link>
            </div>
        </>
    );
}
