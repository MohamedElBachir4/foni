"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AccountInfo = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "reparateur" | "grossiste";
  wilaya?: string;
  shopName?: string;
  address?: string;
};

type StoredAccount = {
  account: AccountInfo;
  token: string | null;
};

type AccountContextValue = {
  account: AccountInfo | null;
  token: string | null;
  getAuthToken: () => string | null;
  setFromApi: (payload: { account: any; token?: string }) => void;
  logout: () => void;
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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadFromStorage();
    if (stored?.account) {
      setAccount(stored.account);
      setToken(stored.token ?? null);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!account) {
      saveToStorage(null);
    } else {
      saveToStorage({ account, token });
    }
  }, [hydrated, account, token]);

  const setFromApi = useCallback((payload: { account: any; token?: string }) => {
    if (!payload?.account) return;
    const acc: AccountInfo = {
      id: String(payload.account._id ?? payload.account.id ?? ""),
      firstName: payload.account.firstName ?? "",
      lastName: payload.account.lastName ?? "",
      email: payload.account.email ?? "",
      phone: payload.account.phone ?? "",
      role: payload.account.role === "grossiste" ? "grossiste" : "reparateur",
      wilaya: payload.account.wilaya ?? "",
      shopName: payload.account.shopName ?? "",
      address: payload.account.address ?? "",
    };
    setAccount(acc);
    setToken(payload.token ?? null);
  }, []);

  const logout = useCallback(() => {
    setAccount(null);
    setToken(null);
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
      getAuthToken,
      setFromApi,
      logout,
    }),
    [account, token, getAuthToken, setFromApi, logout]
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

