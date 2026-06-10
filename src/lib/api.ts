export const API_BASE = "https://api.amazecc.com";

export function apiUrl(path: string) {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getAdminToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

export function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = getAdminToken();

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(apiUrl(path), {
    ...init,
    headers,
  });
}
