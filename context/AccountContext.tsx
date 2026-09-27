"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { clearGuestCheckoutShippingPrefs } from "@/lib/guestCheckoutPrefs";
import {
  isMerchantRole,
  normalizeAccountRole,
  resolvePriceMode,
  type AccountRole,
  type PriceMode,
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
  priceMode?: PriceMode;
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
  setPriceMode: (mode: PriceMode) => Promise<void>;
};

const STORAGE_KEY = "foni_account";

const AccountContext = createContext<AccountContextValue | null>(null);

function mapApiAccount(raw: any): AccountInfo {
  const role = normalizeAccountRole(raw?.role);
  const priceMode: PriceMode =
    role === "merchant"
      ? resolvePriceMode({
          role: raw?.role,
          useWholesalePricing: raw?.useWholesalePricing,
          priceMode: raw?.priceMode,
        })
      : "retail";
  const useWholesalePricing = priceMode === "wholesale";
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
    priceMode,
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
    // ignore quota / private mode
  }
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [useWholesalePricing, setUseWholesalePricingState] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  /** يمنع مسح التخزين أثناء الإقلاع؛ يُمسح فقط عند logout صريح */
  const allowClearRef = useRef(false);

  useEffect(() => {
    const stored = loadFromStorage();
    if (stored?.account) {
      const acc = mapApiAccount(stored.account);
      setAccount(acc);
      setToken(stored.token ?? null);
      setUseWholesalePricingState(!!acc.useWholesalePricing);
      // إعادة كتابة الجلسة لضمان بقائها بعد العودة للموقع
      saveToStorage({
        account: acc,
        token: stored.token ?? null,
        useWholesalePricing: !!acc.useWholesalePricing,
      });
    }
    setHydrated(true);
  }, []);

  const hasAccount = account != null;

  const clearSession = useCallback(() => {
    allowClearRef.current = true;
    saveToStorage(null);
    setAccount(null);
    setToken(null);
    setUseWholesalePricingState(false);
  }, []);

  useEffect(() => {
    if (!hydrated || (!token && !hasAccount)) return;
    let cancelled = false;
    publicFetch("/api/accounts/me", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
      credentials: "include",
    })
      .then(async (res) => {
        if (cancelled) return;
        // 401 = الجلسة مرفوضة من السيرفر (حساب محذوف/رمز غير صالح): الإبقاء عليها
        // يُظهر واجهة تاجر بينما السيرفر يعامل الطلبات كزائر (أسعار التجزئة).
        if (res.status === 401 || res.status === 403) {
          clearSession();
          return;
        }
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (cancelled || !data?.account) return;
        const acc = mapApiAccount(data.account);
        const nextToken =
          typeof data.token === "string" && data.token ? data.token : token;
        setAccount(acc);
        if (nextToken !== token) setToken(nextToken);
        setUseWholesalePricingState(!!acc.useWholesalePricing);
        saveToStorage({
          account: acc,
          token: nextToken,
          useWholesalePricing: !!acc.useWholesalePricing,
        });
      })
      .catch(() => {
        // عند فشل الشبكة نبقي الجلسة المحلية — لا نُسجّل خروجاً تلقائياً
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, token]);

  useEffect(() => {
    if (!hydrated) return;
    if (!account) {
      // لا تمسح localStorage إلا بعد logout صريح
      if (allowClearRef.current) {
        saveToStorage(null);
        allowClearRef.current = false;
      }
      return;
    }
    saveToStorage({ account, token, useWholesalePricing });
  }, [hydrated, account, token, useWholesalePricing]);

  const setFromApi = useCallback((payload: { account: any; token?: string }) => {
    if (!payload?.account) return;
    const acc = mapApiAccount(payload.account);
    const nextToken = payload.token ?? null;
    setAccount(acc);
    setToken(nextToken);
    setUseWholesalePricingState(!!acc.useWholesalePricing);
    // حفظ فوري عند تسجيل الدخول حتى لا تُفقد الجلسة عند إغلاق التبويب مباشرة
    saveToStorage({
      account: acc,
      token: nextToken,
      useWholesalePricing: !!acc.useWholesalePricing,
    });
    clearGuestCheckoutShippingPrefs();
  }, []);

  const logout = useCallback(() => {
    allowClearRef.current = true;
    saveToStorage(null);
    setAccount(null);
    setToken(null);
    setUseWholesalePricingState(false);
    // امسح كوكي الجلسة على السيرفر (لا ننتظر النتيجة)
    publicFetch("/api/accounts/logout", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    }).catch(() => {});
  }, []);

  const setPriceMode = useCallback(
    async (mode: PriceMode) => {
      if (!account) return;
      const previous = account;
      const enabled = mode === "wholesale";
      // تحديث فوري للأسعار في الواجهة ثم التأكيد من السيرفر
      setAccount({ ...previous, priceMode: mode, useWholesalePricing: enabled });
      setUseWholesalePricingState(enabled);

      let res: Response;
      try {
        res = await publicFetch("/api/accounts/me/price-mode", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify({ mode }),
        });
      } catch {
        setAccount(previous);
        setUseWholesalePricingState(!!previous.useWholesalePricing);
        throw new Error("تعذّر الاتصال بالخادم. تحقق من الشبكة وحاول مجدداً.");
      }
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        clearSession();
        throw new Error(data.error || "انتهت الجلسة، يرجى تسجيل الدخول من جديد");
      }
      if (!res.ok || !data?.account) {
        setAccount(previous);
        setUseWholesalePricingState(!!previous.useWholesalePricing);
        throw new Error(data.error || "تعذّر تحديث وضع الأسعار");
      }
      const acc = mapApiAccount(data.account);
      setAccount(acc);
      setUseWholesalePricingState(!!acc.useWholesalePricing);
      saveToStorage({
        account: acc,
        token,
        useWholesalePricing: !!acc.useWholesalePricing,
      });
    },
    [account, token, clearSession]
  );

  const setUseWholesalePricing = useCallback(
    (enabled: boolean) => setPriceMode(enabled ? "wholesale" : "merchant"),
    [setPriceMode]
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
      setPriceMode,
    }),
    [
      account,
      token,
      hydrated,
      getAuthToken,
      setFromApi,
      logout,
      setUseWholesalePricing,
      setPriceMode,
    ]
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
