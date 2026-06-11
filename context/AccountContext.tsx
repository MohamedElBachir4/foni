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
import {
  isMerchantRole,
  normalizeAccountRole,
  resolveUseWholesalePricing,
  type AccountRole,
} from "@/lib/accountRoles";
import { publicFetch } from "@/lib/publicFetch";

export type AccountInfo = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: AccountRole;
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
  hydrated: boolean;
  getAuthToken: () => string | null;
  setFromApi: (payload: { account: any; token?: string }) => void;
  logout: () => void;
  setUseWholesalePricing: (enabled: boolean) => Promise<void>;
};

const STORAGE_KEY = "foni_account";

const AccountContext = createContext<AccountContextValue | null>(null);

function mapApiAccount(raw: any): AccountInfo {
  const role = normalizeAccountRole(raw?.role);
  const useWholesalePricing =
    role === "merchant"
      ? resolveUseWholesalePricing({
          role: raw?.role,
          useWholesalePricing: raw?.useWholesalePricing,
        })
      : false;
  return {
    id: String(raw?._id ?? raw?.id ?? ""),
    firstName: raw?.firstName ?? "",
    lastName: raw?.lastName ?? "",
    email: raw?.email ?? "",
    phone: raw?.phone ?? "",
    role,
    approvalStatus: raw?.approvalStatus ?? "approved",
    wilaya: raw?.wilaya ?? "",
    shopName: raw?.shopName ?? "",
    address: raw?.address ?? "",
    useWholesalePricing,
  };
}

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
      const acc = mapApiAccount(stored.account);
      setAccount(acc);
      setToken(stored.token ?? null);
      setUseWholesalePricingState(!!acc.useWholesalePricing);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !token) return;
    let cancelled = false;
    publicFetch("/api/accounts/me", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.account) return;
        const acc = mapApiAccount(data.account);
        setAccount(acc);
        setUseWholesalePricingState(!!acc.useWholesalePricing);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [hydrated, token]);

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
    const acc = mapApiAccount(payload.account);
    setAccount(acc);
    setToken(payload.token ?? null);
    setUseWholesalePricingState(!!acc.useWholesalePricing);
    clearGuestCheckoutShippingPrefs();
  }, []);

  const logout = useCallback(() => {
    setAccount(null);
    setToken(null);
    setUseWholesalePricingState(false);
  }, []);

  const setUseWholesalePricing = useCallback(
    async (enabled: boolean) => {
      if (!token) return;
      const res = await publicFetch("/api/accounts/me/wholesale-pricing", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "تعذّر تحديث إعداد الشراء بالجملة");
      }
      const acc = mapApiAccount(data.account);
      setAccount(acc);
      setUseWholesalePricingState(!!acc.useWholesalePricing);
    },
    [token]
  );

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

export function useIsMerchant(account: AccountInfo | null): boolean {
  return isMerchantRole(account?.role);
}
