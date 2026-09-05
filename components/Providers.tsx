"use client";

import { CartProvider } from "@/context/CartContext";
import { AccountProvider } from "@/context/AccountContext";
import { StaleDeploymentRecovery } from "@/components/StaleDeploymentRecovery";
import { ThemeAccentBinder } from "@/components/ThemeAccentBinder";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AccountProvider>
      <ThemeAccentBinder />
      <CartProvider>
        <StaleDeploymentRecovery />
        {children}
      </CartProvider>
    </AccountProvider>
  );
}

