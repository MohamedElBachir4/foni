function getApiBase(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL || "").trim();
  if (raw) return raw.replace(/\/+$/, "");
  // Browser: use same-origin /api (handled by Next rewrites/proxy in deployment).
  if (typeof window !== "undefined") return "";
  // Server-side fallback for local dev/runtime scripts.
  return "http://localhost:5000";
}

const API_URL = getApiBase();
const LOGIN_FLAG = "foni_admin_logged_in";
const TOKEN_KEY = "foni_admin_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) return token;

  // Legacy compatibility from older builds where we only stored "true".
  // Treat it as unauthenticated so we don't keep hitting protected endpoints.
  const legacy = localStorage.getItem(LOGIN_FLAG);
  if (legacy === "true") {
    localStorage.removeItem(LOGIN_FLAG);
  }
  return null;
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(LOGIN_FLAG, "true");
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOGIN_FLAG);
  localStorage.removeItem(TOKEN_KEY);
  // Tell backend to clear cookie
  fetch(`${API_URL}/api/admin/logout`, { method: "POST", credentials: "include" }).catch(() => {});
}

export function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export { API_URL };
