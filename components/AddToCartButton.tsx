"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, Check, X } from "lucide-react";

type AddToCartButtonProps = {
  id: string;
  name: string;
  price: number;
  image?: string;
  colors?: string[]; // الألوان المتوفرة (للهواتف فقط)
  productType?: "phone" | "accessory" | "sparePart"; // نوع المنتج
  className?: string;
  children?: React.ReactNode;
};

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

const COLOR_LABELS: Record<string, string> = {
  white: "أبيض",
  black: "أسود",
  gold: "ذهبي",
  silver: "فضي",
  purple: "بنفسجي",
  red: "أحمر",
  blue: "أزرق",
  green: "أخضر",
  gray: "رمادي",
  brown: "بني",
};

export function AddToCartButton({
  id,
  name,
  price,
  image = "",
  colors = [],
  productType = "phone",
  className,
  children,
}: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleAddToCart = useCallback(
    (color?: string) => {
      if (added) return;
      
      addToCart({ 
        id, 
        name, 
        price, 
        image, 
        quantity: 1,
        color: color,
        productType,
      });
      
      setAdded(true);
      setShowColorModal(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setAdded(false), 1800);
    },
    [added, addToCart, id, name, price, image, productType]
  );

  const handleClick = useCallback(() => {
    // إذا كان المنتج هاتف وله ألوان، اعرض نافذة اختيار اللون
    if (productType === "phone" && colors && colors.length > 0) {
      setShowColorModal(true);
    } else {
      handleAddToCart();
    }
  }, [productType, colors, handleAddToCart]);

  const baseClass =
    "inline-flex w-full items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-medium transition-all duration-500 ease-out focus:outline-none focus:ring-2 focus:ring-offset-1 ";
  const defaultClass =
    baseClass +
    "bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-500";
  const successClass =
    baseClass +
    "scale-[0.97] bg-slate-900 text-white focus:ring-slate-500 pointer-events-none";

  if (children) {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className={`${className ?? ""} relative overflow-hidden transition-all duration-500 ease-out ${
            added ? "pointer-events-none !bg-slate-900" : ""
          }`}
        >
          {added ? (
            <span className="flex items-center justify-center gap-2 text-white">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 animate-check-pop">
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
              تمت الإضافة
            </span>
          ) : (
            children
          )}
        </button>
        
        {/* Color Modal */}
        {showColorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">اختر اللون</h3>
                <button
                  onClick={() => setShowColorModal(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mb-6 grid gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleAddToCart(color)}
                    className="flex items-center gap-3 rounded-lg border-2 p-3 transition hover:bg-slate-50"
                    style={{
                      borderColor: selectedColor === color ? "#2563eb" : "#e2e8f0",
                    }}
                  >
                    <div
                      className="h-6 w-6 rounded-full border-2 border-slate-200"
                      style={{
                        backgroundColor: COLOR_HEX[color] || "#" + Math.random().toString(16).slice(2, 8),
                      }}
                    />
                    <span className="font-medium text-slate-800">
                      {COLOR_LABELS[color] || color}
                    </span>
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setShowColorModal(false)}
                className="w-full rounded-lg border border-slate-300 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`${added ? successClass : className ?? defaultClass}`}
      >
        {added ? (
          <>
            <span className="inline-flex animate-check-pop">
              <Check className="h-4 w-4" strokeWidth={2.5} />
            </span>
            تمت الإضافة
          </>
        ) : (
          <>
            <ShoppingCart className="h-3.5 w-3.5" strokeWidth={2} />
            أضف للسلة
          </>
        )}
      </button>
      
      {/* Color Modal */}
      {showColorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">اختر اللون</h3>
              <button
                onClick={() => setShowColorModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6 grid gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleAddToCart(color)}
                  className="flex items-center gap-3 rounded-lg border-2 p-3 transition hover:bg-slate-50"
                  style={{
                    borderColor: selectedColor === color ? "#2563eb" : "#e2e8f0",
                  }}
                >
                  <div
                    className="h-6 w-6 rounded-full border-2 border-slate-200"
                    style={{
                      backgroundColor: COLOR_HEX[color] || "#" + Math.random().toString(16).slice(2, 8),
                    }}
                  />
                  <span className="font-medium text-slate-800">
                    {COLOR_LABELS[color] || color}
                  </span>
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowColorModal(false)}
              className="w-full rounded-lg border border-slate-300 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </>
  );
}
