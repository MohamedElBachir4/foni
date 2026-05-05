"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, Check, X } from "lucide-react";
import { getProductColorLabelAr } from "@/lib/productColors";
import { ProductColorSwatches } from "@/components/ProductColorSwatches";

type AddToCartButtonProps = {
  id: string;
  name: string;
  price: number;
  image?: string;
  colors?: string[];
  options?: string[];
  /** عند true: إضافة مباشرة بلون محدّد من الأب (مثل صفحة المنتج بعد اختيار الدائرة) دون نافذة */
  lockColorToSelection?: boolean;
  /** اللون المستخدم مع lockColorToSelection (معرّف من القائمة) */
  lockedColor?: string;
  /** عند true: إضافة مباشرة بخيار نصي محدّد من الأب */
  lockOptionToSelection?: boolean;
  lockedOption?: string;
  productType?: "phone" | "accessory" | "sparePart";
  className?: string;
  children?: React.ReactNode;
};

export function AddToCartButton({
  id,
  name,
  price,
  image = "",
  colors = [],
  options = [],
  lockColorToSelection = false,
  lockedColor = "",
  lockOptionToSelection = false,
  lockedOption = "",
  productType = "phone",
  className,
  children,
}: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [modalColor, setModalColor] = useState("");
  const [modalOption, setModalOption] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (showColorModal && colors.length) {
      setModalColor((prev) =>
        prev && colors.map((c) => String(c).toLowerCase()).includes(prev.toLowerCase())
          ? prev
          : String(colors[0])
      );
    }
  }, [showColorModal, colors]);

  const handleAddToCart = useCallback(
    (color?: string, option?: string) => {
      if (added) return;

      const hasColors = colors && colors.length > 0;
      const c = color?.trim().toLowerCase();
      const hasOptions = options && options.length > 0;
      const o = String(option || "").trim();
      addToCart({
        id,
        name,
        price,
        image,
        quantity: 1,
        color: hasColors && c ? c : undefined,
        availableColors: hasColors ? colors.map((x) => String(x).toLowerCase()) : undefined,
        option: hasOptions && o ? o : undefined,
        availableOptions: hasOptions ? options.map((x) => String(x).trim()).filter(Boolean) : undefined,
        productType,
      });

      setAdded(true);
      setShowColorModal(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setAdded(false), 1800);
    },
    [added, addToCart, id, name, price, image, productType, colors, options]
  );

  const handleClick = useCallback(() => {
    const normalizedOptions = options.map((x) => String(x || "").trim()).filter(Boolean);
    const hasOptions = normalizedOptions.length > 0;
    if (lockOptionToSelection && hasOptions) {
      const wantOpt = String(lockedOption || normalizedOptions[0] || "").trim();
      const okOpt = normalizedOptions.includes(wantOpt);
      const option = okOpt ? wantOpt : normalizedOptions[0];
      if (lockColorToSelection && colors.length > 0) {
        setModalOption(option);
        const want = String(lockedColor || colors[0] || "")
          .trim()
          .toLowerCase();
        const ok = colors.some((c) => String(c).trim().toLowerCase() === want);
        handleAddToCart(ok ? want : String(colors[0]).trim().toLowerCase(), option);
        return;
      }
      if (colors && colors.length > 0) {
        setModalOption(option);
        setShowColorModal(true);
      } else {
        handleAddToCart(undefined, option);
      }
      return;
    }
    if (lockColorToSelection && colors.length > 0) {
      const want = String(lockedColor || colors[0] || "")
        .trim()
        .toLowerCase();
      const ok = colors.some((c) => String(c).trim().toLowerCase() === want);
      handleAddToCart(ok ? want : String(colors[0]).trim().toLowerCase());
      return;
    }
    if (colors && colors.length > 0) {
      setModalOption("");
      setShowColorModal(true);
    } else {
      handleAddToCart();
    }
  }, [colors, handleAddToCart, lockColorToSelection, lockedColor, lockOptionToSelection, lockedOption, options]);

  const baseClass =
    "inline-flex w-full items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-medium transition-all duration-500 ease-out focus:outline-none focus:ring-2 focus:ring-offset-1 ";
  const defaultClass =
    baseClass +
    "bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-500";
  const successClass =
    baseClass +
    "scale-[0.97] bg-slate-900 text-white focus:ring-slate-500 pointer-events-none";

  const colorModal = showColorModal && colors.length > 0 && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">اختر اللون</h3>
          <button
            type="button"
            onClick={() => setShowColorModal(false)}
            className="rounded-lg p-1 transition hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5">
          <p className="mb-3 text-sm text-slate-600">اختر لوناً من الدوائر ثم أكّد الإضافة.</p>
          <div className="flex justify-center">
            <ProductColorSwatches colorIds={colors} value={modalColor} onChange={setModalColor} size="md" />
          </div>
          <p className="mt-3 text-center text-sm font-semibold text-slate-800">
            {getProductColorLabelAr(modalColor)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (modalColor) handleAddToCart(modalColor, modalOption || undefined);
          }}
          className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-500"
        >
          <ShoppingCart className="h-4 w-4" />
          أضف للسلة بهذا اللون
        </button>

        <button
          type="button"
          onClick={() => setShowColorModal(false)}
          className="w-full rounded-lg border border-slate-300 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
        >
          إلغاء
        </button>
      </div>
    </div>
  );

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
        {colorModal}
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
      {colorModal}
    </>
  );
}
