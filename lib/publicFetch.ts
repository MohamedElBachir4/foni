import { apiUrl } from "./apiUrl";

const ACCOUNT_STORAGE_KEY = "foni_account";

/** قراءة توكن الحساب من localStorage لإرفاقه بطلبات المنتجات (أسعار حسب الدور). */
export function readStoredAccountToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string | null };
    const token = parsed?.token;
    return typeof token === "string" && token.trim() ? token.trim() : null;
  } catch {
    return null;
  }
}

/**
 * يحلّ مسار API نسبياً عبر نفس نطاق الواجهة عند الإمكان (أقل مشاكل على LTE من طلبات كاملة إلى نطاق فرعي آخر).
 */
export function resolvePublicApiUrl(pathOrAbsolute: string): string {
  const p = pathOrAbsolute.trim();
  if (/^https?:\/\//i.test(p)) return p;
  return apiUrl(p.startsWith("/") ? p : `/${p}`);
}

const DEFAULT_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 55_000;

/** مهلة أطول على شبكات الجوال البطيئة (Network Information API عند توفرها). */
export function adaptivePublicFetchTimeoutMs(): number {
  if (typeof navigator === "undefined") return DEFAULT_TIMEOUT_MS;
  const nav = navigator as Navigator & {
    connection?: { effectiveType?: string; saveData?: boolean };
  };
  if (nav.connection?.saveData) return 75_000;
  const ect = nav.connection?.effectiveType;
  if (ect === "slow-2g" || ect === "2g") return 95_000;
  if (ect === "3g") return 68_000;
  return DEFAULT_TIMEOUT_MS;
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function backoffWithJitter(attempt: number): number {
  const bases = [380, 1100, 2400];
  const base = bases[Math.min(attempt, bases.length - 1)] ?? 2400;
  return base + Math.floor(Math.random() * 520);
}

function shouldRetryHttpStatus(status: number): boolean {
  return status === 408 || status === 502 || status === 503 || status === 504;
}

function mergeUserAndTimeoutSignal(
  user: AbortSignal | undefined,
  timeoutMs: number
): { signal: AbortSignal; cleanup: () => void } {
  const c = new AbortController();
  const t = setTimeout(() => {
    c.abort(new DOMException("Request timeout", "TimeoutError"));
  }, timeoutMs);
  const onUser = () => {
    clearTimeout(t);
    c.abort(user?.reason);
  };
  if (user) {
    if (user.aborted) {
      clearTimeout(t);
      c.abort(user.reason);
    } else {
      user.addEventListener("abort", onUser, { once: true });
    }
  }
  const cleanup = () => {
    clearTimeout(t);
    if (user) user.removeEventListener("abort", onUser);
  };
  return { signal: c.signal, cleanup };
}

function isRetryableTransportFailure(err: unknown): boolean {
  if (err instanceof TypeError) return true;
  if (err instanceof DOMException) {
    return err.name === "AbortError" || err.name === "TimeoutError";
  }
  return false;
}

export type PublicFetchOptions = RequestInit & {
  timeoutMs?: number;
  /** للـ GET/HEAD فقط يُطبَّق تلقائياً؛ POST/PUT… محاولة واحدة لتجنب التكرار غير الآمن. */
  maxRetries?: number;
};

/**
 * fetch للواجهة العامة: نفس الأصل عند الإمكان، مهلة مناسبة لـ LTE، وإعادة محاولة على الأعطال المؤقتة.
 */
export async function publicFetch(
  pathOrAbsolute: string,
  init: PublicFetchOptions = {}
): Promise<Response> {
  const {
    timeoutMs = adaptivePublicFetchTimeoutMs(),
    maxRetries = DEFAULT_RETRIES,
    signal: userSignalIn,
    ...rest
  } = init;
  const userSignal = userSignalIn ?? undefined;
  const method = String(rest.method || "GET").toUpperCase();
  const allowRetry =
    method === "GET" || method === "HEAD" || method === "OPTIONS";
  const maxAttempts = allowRetry ? maxRetries : 1;
  const url = resolvePublicApiUrl(pathOrAbsolute);

  const headers = new Headers(rest.headers);
  if (!headers.has("Authorization")) {
    const token = readStoredAccountToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { signal, cleanup } = mergeUserAndTimeoutSignal(userSignal, timeoutMs);
    try {
      const res = await fetch(url, { ...rest, headers, signal });
      if (res.ok) {
        cleanup();
        return res;
      }
      if (!shouldRetryHttpStatus(res.status) || attempt === maxAttempts - 1) {
        cleanup();
        return res;
      }
      cleanup();
      await sleep(backoffWithJitter(attempt));
    } catch (e) {
      cleanup();
      if (userSignal?.aborted) throw e;
      if (attempt < maxAttempts - 1 && isRetryableTransportFailure(e)) {
        await sleep(backoffWithJitter(attempt));
        continue;
      }
      throw e;
    }
  }

  throw new Error("publicFetch failed");
}

/** رسائل عربية مناسبة للعرض عند فشل الطلب على الشبكة. */
export function formatPublicFetchError(err: unknown, fallback: string): string {
  if (err instanceof TypeError) {
    return "تعذّر الاتصال بالخادم. تحقق من بيانات الجوال أو الـ Wi‑Fi وحاول مجدداً.";
  }
  if (err instanceof DOMException) {
    if (err.name === "AbortError" || err.name === "TimeoutError") {
      return "انتهت مهلة الاتصال أو الشبكة غير مستقرة. حاول مجدداً بعد لحظات.";
    }
  }
  if (err instanceof Error && err.message && err.message !== "publicFetch failed") {
    return err.message;
  }
  return fallback;
}
