const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const LOGIN_FLAG = "foni_admin_logged_in";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  // We use this as a simple true/false flag since the real token is in an HttpOnly cookie
  return localStorage.getItem(LOGIN_FLAG);
}

export function setToken(_token: string): void {
  if (typeof window === "undefined") return;
  // Store a non-sensitive flag
  localStorage.setItem(LOGIN_FLAG, "true");
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOGIN_FLAG);
  // Tell backend to clear cookie
  fetch(`${API_URL}/api/admin/logout`, { method: "POST", credentials: "include" }).catch(() => {});
}

export function getAuthHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    // Token is automatically sent via HttpOnly cookie
  };
}

export { API_URL };
