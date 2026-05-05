"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CART_STORAGE_KEY = "foni_cart";

export type CartVariantSelection = {
  label: string;
  price: number;
  quantity: number;
};

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  color?: string;
  /** ألوان المنتج المعروضة للزبون (للتحقق عند الطلب وتغيير اللون من السلة/الدفع) */
  availableColors?: string[];
  option?: string;
  availableOptions?: string[];
  productType?: "phone" | "accessory" | "sparePart";
  /** عدة خيارات بأسعار وكميات (قطع غيار / أكسسوارات) */
  hasVariants?: boolean;
  variantSelections?: CartVariantSelection[];
};

function variantSelectionsSignature(sel: CartVariantSelection[] | undefined): string {
  if (!sel?.length) return "";
  return [...sel]
    .map((v) => `${encodeURIComponent(v.label)}:${v.quantity}:${v.price}`)
    .sort()
    .join("|");
}

export function cartLineKey(i: CartItem): string {
  const colorPart = i.color ? `||c:${i.color}` : "";
  const optionPart = i.option ? `||o:${i.option}` : "";
  const mv =
    i.hasVariants && i.variantSelections?.length
      ? `||mv:${variantSelectionsSignature(i.variantSelections)}`
      : "";
  return `${i.id}${colorPart}${optionPart}${mv}`;
}

export function cartLineSubtotal(i: CartItem): number {
  if (i.hasVariants && i.variantSelections?.length) {
    return i.variantSelections.reduce(
      (sum, v) => sum + Math.max(0, Number(v.price) || 0) * Math.max(1, Math.floor(Number(v.quantity)) || 1),
      0
    );
  }
  return Math.max(0, Number(i.price) || 0) * Math.max(1, Math.floor(Number(i.quantity)) || 1);
}

export function cartLineTotalQty(i: CartItem): number {
  if (i.hasVariants && i.variantSelections?.length) {
    return i.variantSelections.reduce((sum, v) => sum + Math.max(1, Math.floor(Number(v.quantity)) || 1), 0);
  }
  return Math.max(1, Math.floor(Number(i.quantity)) || 1);
}

function mergeVariantSelections(
  a: CartVariantSelection[],
  b: CartVariantSelection[]
): CartVariantSelection[] {
  const map = new Map<string, CartVariantSelection>();
  for (const arr of [a, b]) {
    for (const v of arr) {
      const label = String(v.label || "").trim();
      if (!label) continue;
      const price = Math.max(0, Number(v.price) || 0);
      const quantity = Math.max(1, Math.floor(Number(v.quantity)) || 1);
      const prev = map.get(label);
      if (prev) {
        map.set(label, { label, price, quantity: prev.quantity + quantity });
      } else {
        map.set(label, { label, price, quantity });
      }
    }
  }
  return [...map.values()];
}

type CartContextValue = {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity"> | CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  /** تغيير كمية فرعية لخيار ضمن سطر «تعدد الخيارات» */
  updateVariantSelectionQuantity: (lineKey: string, label: string, quantity: number) => void;
  /** تغيير لون سطر السلة (المفتاح: id أو id||اللون الحالي) */
  updateLineColor: (lineKey: string, newColor: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextValue | null>(null);

function normalizeCartItemColors(list: CartItem[]): CartItem[] {
  return list.map((i) => {
    if (i.hasVariants && Array.isArray(i.variantSelections) && i.variantSelections.length > 0) {
      const ac = Array.isArray(i.availableColors)
        ? i.availableColors.map((x) => String(x).trim().toLowerCase()).filter(Boolean)
        : [];
      const col = String(i.color || "").trim().toLowerCase();
      const colorOk = ac.length ? (col && ac.includes(col) ? col : ac[0]) : col || undefined;
      const totalQty = cartLineTotalQty(i);
      const subtotal = cartLineSubtotal(i);
      return {
        ...i,
        availableColors: ac.length ? ac : undefined,
        color: colorOk,
        option: undefined,
        availableOptions: undefined,
        quantity: totalQty,
        price: totalQty > 0 ? subtotal / totalQty : 0,
        variantSelections: i.variantSelections!.map((v) => ({
          label: String(v.label || "").trim(),
          price: Math.max(0, Number(v.price) || 0),
          quantity: Math.max(1, Math.floor(Number(v.quantity)) || 1),
        })),
      };
    }
    const ac = Array.isArray(i.availableColors)
      ? i.availableColors.map((x) => String(x).trim().toLowerCase()).filter(Boolean)
      : [];
    const ao = Array.isArray(i.availableOptions)
      ? i.availableOptions.map((x) => String(x).trim()).filter(Boolean)
      : [];
    const opt = String(i.option || "").trim();
    const optionOk = ao.length ? (opt && ao.includes(opt) ? opt : ao[0]) : opt || undefined;
    if (!ac.length) return { ...i, availableOptions: ao.length ? ao : undefined, option: optionOk };
    const col = String(i.color || "").trim().toLowerCase();
    const colorOk = col && ac.includes(col) ? col : ac[0];
    return {
      ...i,
      availableColors: ac,
      color: colorOk,
      availableOptions: ao.length ? ao : undefined,
      option: optionOk,
    };
  });
}

function loadFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : [];
    return normalizeCartItemColors(list);
  } catch {
    return [];
  }
}

function saveToStorage(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setItems(loadFromStorage());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    saveToStorage(items);
  }, [mounted, items]);

  const addToCart = useCallback(
    (item: Omit<CartItem, "quantity"> | CartItem) => {
      const q = "quantity" in item ? item.quantity : 1;
      setItems((prev) => {
        const incomingVariants =
          (item as CartItem).hasVariants &&
          Array.isArray((item as CartItem).variantSelections) &&
          (item as CartItem).variantSelections!.length > 0
            ? (item as CartItem).variantSelections!.filter((v) => Number(v.quantity) > 0)
            : null;

        if (incomingVariants && incomingVariants.length > 0) {
          const totalQty = incomingVariants.reduce((s, v) => s + Math.max(1, Math.floor(Number(v.quantity)) || 1), 0);
          const subtotal = incomingVariants.reduce(
            (s, v) =>
              s + Math.max(0, Number(v.price) || 0) * Math.max(1, Math.floor(Number(v.quantity)) || 1),
            0
          );
          const avg = totalQty > 0 ? subtotal / totalQty : 0;
          const acRaw = (item as CartItem).availableColors;
          const ac = Array.isArray(acRaw)
            ? acRaw.map((x) => String(x).trim().toLowerCase()).filter(Boolean)
            : undefined;
          const rawCol = (item as CartItem).color
            ? String((item as CartItem).color).trim().toLowerCase()
            : "";
          let nextColor: string | undefined;
          let nextAc: string[] | undefined;
          if (ac?.length) {
            nextAc = ac;
            nextColor = rawCol && ac.includes(rawCol) ? rawCol : ac[0];
          } else {
            nextAc = undefined;
            nextColor = rawCol || undefined;
          }

          const normalizedSel = incomingVariants.map((v) => ({
            label: String(v.label || "").trim(),
            price: Math.max(0, Number(v.price) || 0),
            quantity: Math.max(1, Math.floor(Number(v.quantity)) || 1),
          }));

          const stub: CartItem = {
            id: item.id,
            name: item.name,
            price: avg,
            image: item.image ?? "",
            quantity: totalQty,
            color: nextColor,
            availableColors: nextAc,
            productType: (item as CartItem).productType,
            hasVariants: true,
            variantSelections: normalizedSel,
          };
          const itemKey = cartLineKey(stub);
          const existing = prev.find((x) => cartLineKey(x) === itemKey);
          if (existing?.hasVariants && existing.variantSelections?.length) {
            const merged = mergeVariantSelections(existing.variantSelections, normalizedSel);
            const mQty = merged.reduce((s, v) => s + v.quantity, 0);
            const mSub = merged.reduce((s, v) => s + v.price * v.quantity, 0);
            return prev.map((x) =>
              cartLineKey(x) === itemKey
                ? {
                    ...existing,
                    name: item.name,
                    image: item.image ?? existing.image,
                    variantSelections: merged,
                    quantity: mQty,
                    price: mQty > 0 ? mSub / mQty : 0,
                  }
                : x
            );
          }
          return [...prev, stub];
        }

        // للهواتف مع الألوان، استخدم id + color كـ key فريد
        const acRaw = (item as CartItem).availableColors;
        const ac = Array.isArray(acRaw)
          ? acRaw.map((x) => String(x).trim().toLowerCase()).filter(Boolean)
          : undefined;
        const rawCol = (item as CartItem).color
          ? String((item as CartItem).color).trim().toLowerCase()
          : "";
        let nextColor: string | undefined;
        let nextAc: string[] | undefined;
        if (ac?.length) {
          nextAc = ac;
          nextColor = rawCol && ac.includes(rawCol) ? rawCol : ac[0];
        } else {
          nextAc = undefined;
          nextColor = rawCol || undefined;
        }
        const aoRaw = (item as CartItem).availableOptions;
        const ao = Array.isArray(aoRaw)
          ? aoRaw.map((x) => String(x).trim()).filter(Boolean)
          : undefined;
        const rawOption = String((item as CartItem).option || "").trim();
        const nextOption = ao?.length ? (rawOption && ao.includes(rawOption) ? rawOption : ao[0]) : rawOption || undefined;

        const itemKey = cartLineKey({
          id: item.id,
          name: "",
          price: 0,
          image: "",
          quantity: 1,
          color: nextColor,
          option: nextOption,
        });
        const existing = prev.find((i) => cartLineKey(i) === itemKey);
        const sameProductAndColor = ao?.length
          ? prev.filter(
              (i) =>
                i.id === item.id &&
                String(i.color || "").trim().toLowerCase() ===
                  String(nextColor || "").trim().toLowerCase()
            )
          : [];
        const existingByIdAndColor =
          sameProductAndColor.length > 0 ? sameProductAndColor[0] : null;

        if (existing) {
          return prev.map((i) => {
            const existingKey = cartLineKey(i);
            return existingKey === itemKey
              ? { ...i, quantity: i.quantity + (q || 1) }
              : i;
          });
        }

        // للمنتجات ذات الخيارات (مثل 128/256/512): لا ننشئ سطرًا جديدًا عند تغيير الخيار،
        // بل نُحدّث نفس السطر (نفس المنتج + نفس اللون) ونزيل أي سطور خيارات قديمة
        // لنفس المنتج حتى لا يظهر 128 و512 معاً في الملخص.
        if (existingByIdAndColor) {
          const mergedQuantity =
            sameProductAndColor.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0) +
            (q || 1);

          return prev
            .filter((i) => !sameProductAndColor.includes(i))
            .concat({
              ...existingByIdAndColor,
              name: item.name,
              price: item.price,
              image: item.image ?? existingByIdAndColor.image,
              color: nextColor,
              availableColors: nextAc,
              option: nextOption,
              availableOptions: ao,
              quantity: mergedQuantity,
              productType: (item as CartItem).productType ?? existingByIdAndColor.productType,
            });
        }

        return [
          ...prev,
          {
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image ?? "",
            quantity: q || 1,
            color: nextColor,
            availableColors: nextAc,
            option: nextOption,
            availableOptions: ao,
            productType: (item as CartItem).productType,
          },
        ];
      });
    },
    []
  );

  const removeFromCart = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => cartLineKey(i) !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    const n = Math.max(0, Math.floor(quantity));
    setItems((prev) => {
      if (n === 0) return prev.filter((i) => cartLineKey(i) !== id);
      return prev.map((i) => {
        if (cartLineKey(i) !== id) return i;
        if (i.hasVariants && i.variantSelections?.length) {
          const cur = cartLineTotalQty(i);
          if (cur <= 0 || n === 0) return i;
          const factor = n / cur;
          const nextSel = i.variantSelections.map((v) => ({
            ...v,
            quantity: Math.max(1, Math.round(v.quantity * factor)),
          }));
          let drift = n - nextSel.reduce((s, v) => s + v.quantity, 0);
          const adjusted = [...nextSel];
          let idx = 0;
          while (drift !== 0 && adjusted.length > 0) {
            const step = drift > 0 ? 1 : -1;
            const ni = idx % adjusted.length;
            const nv = adjusted[ni].quantity + step;
            if (nv >= 1) {
              adjusted[ni] = { ...adjusted[ni], quantity: nv };
              drift -= step;
            }
            idx += 1;
            if (idx > adjusted.length * 1000) break;
          }
          const mQty = adjusted.reduce((s, v) => s + v.quantity, 0);
          const mSub = adjusted.reduce((s, v) => s + v.price * v.quantity, 0);
          return {
            ...i,
            variantSelections: adjusted,
            quantity: mQty,
            price: mQty > 0 ? mSub / mQty : 0,
          };
        }
        return { ...i, quantity: n };
      });
    });
  }, []);

  const updateVariantSelectionQuantity = useCallback((lineKeyStr: string, label: string, quantity: number) => {
    const n = Math.max(0, Math.floor(quantity));
    const wantLabel = String(label || "").trim();
    setItems((prev) =>
      prev.flatMap((i) => {
        if (cartLineKey(i) !== lineKeyStr) return [i];
        if (!i.hasVariants || !i.variantSelections?.length) return [i];
        const nextSel = i.variantSelections
          .map((v) =>
            String(v.label).trim() === wantLabel ? { ...v, quantity: n } : { ...v }
          )
          .filter((v) => v.quantity > 0);
        if (nextSel.length === 0) return [];
        const mQty = nextSel.reduce((s, v) => s + v.quantity, 0);
        const mSub = nextSel.reduce((s, v) => s + v.price * v.quantity, 0);
        return [
          {
            ...i,
            variantSelections: nextSel,
            quantity: mQty,
            price: mQty > 0 ? mSub / mQty : 0,
          },
        ];
      })
    );
  }, []);

  const updateLineColor = useCallback((lineKey: string, newColor: string) => {
    const nc = String(newColor || "").trim().toLowerCase();
    setItems((prev) =>
      prev.map((i) => {
        if (cartLineKey(i) !== lineKey) return i;
        const allowed = i.availableColors;
        if (allowed?.length) {
          const ok = allowed.some((a) => String(a).trim().toLowerCase() === nc);
          if (!ok) return i;
        }
        return { ...i, color: nc || undefined };
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + cartLineTotalQty(i), 0), [items]);
  const totalPrice = useMemo(() => items.reduce((sum, i) => sum + cartLineSubtotal(i), 0), [items]);

  const value = useMemo(
    () => ({
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateVariantSelectionQuantity,
      updateLineColor,
      clearCart,
      totalItems,
      totalPrice,
    }),
    [
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateVariantSelectionQuantity,
      updateLineColor,
      clearCart,
      totalItems,
      totalPrice,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
