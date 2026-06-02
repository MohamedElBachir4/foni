"use client";

import { CartProvider } from "@/context/CartContext";
import { AccountProvider } from "@/context/AccountContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AccountProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </AccountProvider>
  );
}

