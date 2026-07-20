"use client";

import { CartProvider } from "@/context/CartContext";
import { AccountProvider } from "@/context/AccountContext";
import { StaleDeploymentRecovery } from "@/components/StaleDeploymentRecovery";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AccountProvider>
      <CartProvider>
        <StaleDeploymentRecovery />
        {children}
      </CartProvider>
    </AccountProvider>
  );
}

