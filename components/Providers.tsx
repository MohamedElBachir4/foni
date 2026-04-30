"use client";

import { CartProvider } from "@/context/CartContext";
import { AccountProvider } from "@/context/AccountContext";
import { RegisterPromptBanner } from "@/components/RegisterPromptBanner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AccountProvider>
      <CartProvider>
        {children}
        <RegisterPromptBanner />
      </CartProvider>
    </AccountProvider>
  );
}

