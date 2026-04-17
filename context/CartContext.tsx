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
  color?: string; // لون المنتج (للهواتف فقط)
  productType?: "phone" | "accessory" | "sparePart"; // نوع المنتج
};

type CartContextValue = {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity"> | CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextValue | null>(null);

function loadFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
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
        const itemKey = item.color ? `${item.id}||${item.color}` : item.id;
        const existing = prev.find((i) => {
          const existingKey = i.color ? `${i.id}||${i.color}` : i.id;
          return existingKey === itemKey;
        });
        
        if (existing) {
          return prev.map((i) => {
            const existingKey = i.color ? `${i.id}||${i.color}` : i.id;
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
            color: item.color,
            productType: (item as CartItem).productType,
          },
        ];
      });
    },
    []
  );

  const removeFromCart = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => {
      const itemKey = i.color ? `${i.id}||${i.color}` : i.id;
      return itemKey !== id;
    }));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    const n = Math.max(0, Math.floor(quantity));
    setItems((prev) => {
      if (n === 0) return prev.filter((i) => {
        const itemKey = i.color ? `${i.id}||${i.color}` : i.id;
        return itemKey !== id;
      });
      return prev.map((i) => {
        const itemKey = i.color ? `${i.id}||${i.color}` : i.id;
        return itemKey === id ? { ...i, quantity: n } : i;
      });
    });
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
      clearCart,
      totalItems,
      totalPrice,
    }),
    [
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
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
