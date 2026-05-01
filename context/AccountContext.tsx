"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { clearGuestCheckoutShippingPrefs } from "@/lib/guestCheckoutPrefs";

export type AccountInfo = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "reparateur" | "grossiste";
  approvalStatus?: "pending" | "approved" | "rejected";
  useWholesalePricing?: boolean;
  wilaya?: string;
  shopName?: string;
  address?: string;
};

type StoredAccount = {
  account: AccountInfo;
  token: string | null;
  useWholesalePricing?: boolean;
};

type AccountContextValue = {
  account: AccountInfo | null;
  token: string | null;
  /** true after reading localStorage on the client (avoid flash for logged-in users). */
  hydrated: boolean;
  getAuthToken: () => string | null;
  setFromApi: (payload: { account: any; token?: string }) => void;
  logout: () => void;
  setUseWholesalePricing: (enabled: boolean) => void;
};

const STORAGE_KEY = "foni_account";

const AccountContext = createContext<AccountContextValue | null>(null);

function loadFromStorage(): StoredAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAccount;
    if (!parsed?.account) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveToStorage(value: StoredAccount | null) {
  if (typeof window === "undefined") return;
  try {
    if (!value) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    }
  } catch {
    // ignore
  }
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [useWholesalePricing, setUseWholesalePricingState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadFromStorage();
    if (stored?.account) {
      setAccount({
        ...stored.account,
        useWholesalePricing: !!stored.useWholesalePricing,
      });
      setToken(stored.token ?? null);
      setUseWholesalePricingState(!!stored.useWholesalePricing);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!account) {
      saveToStorage(null);
    } else {
      saveToStorage({ account, token, useWholesalePricing });
    }
  }, [hydrated, account, token, useWholesalePricing]);

  const setFromApi = useCallback((payload: { account: any; token?: string }) => {
    if (!payload?.account) return;
    const acc: AccountInfo = {
      id: String(payload.account._id ?? payload.account.id ?? ""),
      firstName: payload.account.firstName ?? "",
      lastName: payload.account.lastName ?? "",
      email: payload.account.email ?? "",
      phone: payload.account.phone ?? "",
      role: payload.account.role === "grossiste" ? "grossiste" : "reparateur",
      approvalStatus: payload.account.approvalStatus ?? "approved",
      wilaya: payload.account.wilaya ?? "",
      shopName: payload.account.shopName ?? "",
      address: payload.account.address ?? "",
      useWholesalePricing: false,
    };
    setAccount(acc);
    setToken(payload.token ?? null);
    setUseWholesalePricingState(false);
    clearGuestCheckoutShippingPrefs();
  }, []);

  const logout = useCallback(() => {
    setAccount(null);
    setToken(null);
    setUseWholesalePricingState(false);
  }, []);

  const setUseWholesalePricing = useCallback((enabled: boolean) => {
    setUseWholesalePricingState(enabled);
    setAccount((prev) => {
      if (!prev || prev.role !== "reparateur") return prev;
      return { ...prev, useWholesalePricing: enabled };
    });
  }, []);

  const getAuthToken = useCallback(() => {
    if (token) return token;
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoredAccount;
      return parsed?.token ?? null;
    } catch {
      return null;
    }
  }, [token]);

  const value = useMemo(
    () => ({
      account,
      token,
      hydrated,
      getAuthToken,
      setFromApi,
      logout,
      setUseWholesalePricing,
    }),
    [account, token, hydrated, getAuthToken, setFromApi, logout, setUseWholesalePricing]
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) {
    throw new Error("useAccount must be used within AccountProvider");
  }
  return ctx;
}

