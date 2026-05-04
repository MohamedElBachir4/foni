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
};

function cartLineKey(i: CartItem): string {
  const colorPart = i.color ? `||c:${i.color}` : "";
  const optionPart = i.option ? `||o:${i.option}` : "";
  return `${i.id}${colorPart}${optionPart}`;
}

type CartContextValue = {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity"> | CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  /** تغيير لون سطر السلة (المفتاح: id أو id||اللون الحالي) */
  updateLineColor: (lineKey: string, newColor: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextValue | null>(null);

function normalizeCartItemColors(list: CartItem[]): CartItem[] {
  return list.map((i) => {
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

        if (existing) {
          return prev.map((i) => {
            const existingKey = cartLineKey(i);
            return existingKey === itemKey
              ? { ...i, quantity: i.quantity + (q || 1) }
              : i;
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
      return prev.map((i) => (cartLineKey(i) === id ? { ...i, quantity: n } : i));
    });
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

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );
  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
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
