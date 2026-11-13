/**
 * Amaze ID OIDC client (authorization code + PKCE, RFC 6749 §4.1 + RFC 7636).
 *
 * This is a static SPA (GitHub Pages), so it is a *public* OAuth client:
 * no client secret (anything shipped to the browser is public). Confidentiality
 * comes from PKCE + exact-match redirect URIs. The server side issues short-lived
 * (1h) access tokens; refresh tokens rotate on use and are revoked on sign-out.
 *
 * The ID token is intentionally NOT validated here - user identity comes from
 * the userinfo endpoint (`customUserInfoClaims` puts `role`/`permissions` on it),
 * which is signed to the caller and always fresh.
 *
 * SSO: visiting while signed in at auth.amazecc.com silently completes the
 * authorize step (skip_consent on the client + `prompt=none`), so one Amaze ID
 * session covers every AmazeCC app.
 */
const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_URL ?? "https://auth.amazecc.com";

export const OIDC = {
  clientId: "amazecc-admin-dashboard",
  redirectUri: () => `${window.location.origin}/auth/callback`,
  scope: "openid profile email offline_access",
  authorizeEndpoint: `${AUTH_BASE}/api/auth/oauth2/authorize`,
  tokenEndpoint: `${AUTH_BASE}/api/auth/oauth2/token`,
  userinfoEndpoint: `${AUTH_BASE}/api/auth/oauth2/userinfo`,
  revocationEndpoint: `${AUTH_BASE}/api/auth/oauth2/revoke`,
} as const;

const KEYS = {
  accessToken: "amaze_oidc_access_token",
  refreshToken: "amaze_oidc_refresh_token",
  expiresAt: "amaze_oidc_expires_at",
  user: "amaze_oidc_user",
  // One silent auto-attempt per browser tab session - prevents redirect loops
  // when the IdP has no session (prompt=none would bounce back with login_required).
  autoAttempted: "amaze_oidc_auto_attempted",
  // Per-authorization PKCE state (sessionStorage so tabs don't clobber each other).
  verifier: "amaze_oidc_verifier",
  state: "amaze_oidc_state",
} as const;

export interface StoredUser {
  sub: string;
  name: string;
  email: string;
  role: "superadmin" | "admin" | "user";
  permissions: string[];
}

function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const b of arr) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomString(byteLength = 48): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

export async function createPkcePair(): Promise<{ verifier: string; challenge: string }> {
  const verifier = randomString(48);
  const challenge = base64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  return { verifier, challenge };
}

function storeTokens(data: { access_token: string; expires_in?: number; refresh_token?: string }) {
  localStorage.setItem(KEYS.accessToken, data.access_token);
  // 30s clock-skew buffer so we never race token expiry at the API.
  const expiresAt = Date.now() + Math.max((data.expires_in ?? 3600) - 30, 60) * 1000;
  localStorage.setItem(KEYS.expiresAt, String(expiresAt));
  if (data.refresh_token) localStorage.setItem(KEYS.refreshToken, data.refresh_token);
}

export function clearOidcStorage() {
  for (const key of [KEYS.accessToken, KEYS.refreshToken, KEYS.expiresAt, KEYS.user]) {
    localStorage.removeItem(key);
  }
  // One-time cleanup of the pre-OIDC storage keys.
  for (const key of ["admin_token", "admin_role", "admin_permissions"]) {
    localStorage.removeItem(key);
  }
}

export function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(KEYS.user);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

/** Cached token that is certainly still valid, else null. Never blocks on a refresh. */
export function getAccessTokenSync(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(KEYS.accessToken);
  const exp = Number(localStorage.getItem(KEYS.expiresAt) ?? 0);
  return token && Date.now() < exp ? token : null;
}

async function fetchUserinfo(accessToken: string): Promise<StoredUser | null> {
  const res = await fetch(OIDC.userinfoEndpoint, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as Record<string, unknown>;
  const rawRole = typeof body.role === "string" ? body.role : "user";
  const role: StoredUser["role"] = rawRole === "superadmin" ? "superadmin" : rawRole === "admin" ? "admin" : "user";
  const perms =
    typeof body.permissions === "string"
      ? body.permissions.split(",").map((p) => p.trim()).filter(Boolean)
      : Array.isArray(body.permissions)
        ? (body.permissions as string[])
        : [];
  const user: StoredUser = {
    sub: String(body.sub ?? ""),
    name: typeof body.name === "string" ? body.name : String(body.email ?? ""),
    email: String(body.email ?? ""),
    role,
    permissions: perms,
  };
  localStorage.setItem(KEYS.user, JSON.stringify(user));
  return user;
}

export interface CallbackResult {
  ok: boolean;
  error?: string;
}

/** Complete the authorization_code flow. Call from the /auth/callback page. */
export async function handleCallback(): Promise<CallbackResult> {
  const params = new URLSearchParams(window.location.search);
  const error = params.get("error");
  if (error) {
    return { ok: false, error: params.get("error_description") ?? error };
  }
  const code = params.get("code");
  const state = params.get("state");
  const expectedState = sessionStorage.getItem(KEYS.state);
  if (!code || !state || !expectedState || state !== expectedState) {
    return { ok: false, error: "The sign-in response didn't match this browser. Please try again." };
  }
  const verifier = sessionStorage.getItem(KEYS.verifier);
  if (!verifier) {
    return { ok: false, error: "Missing PKCE verifier - please sign in again." };
  }

  const res = await fetch(OIDC.tokenEndpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: OIDC.redirectUri(),
      client_id: OIDC.clientId,
      code_verifier: verifier,
    }).toString(),
  });
  const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !body || typeof body.access_token !== "string") {
    const desc = body && typeof body.error_description === "string" ? body.error_description : "Token exchange failed.";
    return { ok: false, error: desc };
  }
  storeTokens(body as { access_token: string; expires_in?: number; refresh_token?: string });
  await fetchUserinfo(body.access_token as string);
  sessionStorage.removeItem(KEYS.verifier);
  sessionStorage.removeItem(KEYS.state);
  // Fresh sign-in: allow a future silent attempt on the next anonymous visit.
  sessionStorage.removeItem(KEYS.autoAttempted);
  return { ok: true };
}

/** Refresh the access token if expired/near-expiry. Returns a valid token or null. */
export async function ensureFreshAccessToken(): Promise<string | null> {
  const cached = getAccessTokenSync();
  if (cached) return cached;
  const refresh = localStorage.getItem(KEYS.refreshToken);
  if (!refresh) return null;
  const res = await fetch(OIDC.tokenEndpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refresh,
      client_id: OIDC.clientId,
    }).toString(),
  });
  if (!res.ok) {
    clearOidcStorage();
    return null;
  }
  const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body.access_token !== "string") {
    clearOidcStorage();
    return null;
  }
  storeTokens(body as { access_token: string; expires_in?: number; refresh_token?: string });
  // Keep userinfo fresh after every refresh so role/permission changes propagate.
  await fetchUserinfo(body.access_token as string).catch(() => null);
  return body.access_token as string;
}

async function revoke(token: string, hint: "refresh_token" | "access_token") {
  try {
    await fetch(OIDC.revocationEndpoint, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token, client_id: OIDC.clientId, token_type_hint: hint }).toString(),
    });
  } catch {
    // Best effort - the provider expires everything within an hour anyway.
  }
}

/** Sign out: revoke tokens at the IdP, then drop local state. The IdP session stays (SSO). */
export async function signOutOidc() {
  const access = localStorage.getItem(KEYS.accessToken);
  const refresh = localStorage.getItem(KEYS.refreshToken);
  await Promise.allSettled([access ? revoke(access, "access_token") : Promise.resolve(), refresh ? revoke(refresh, "refresh_token") : Promise.resolve()]);
  clearOidcStorage();
}

async function authorize(prompt: "none" | "login" | null) {
  const { verifier, challenge } = await createPkcePair();
  const state = randomString(24);
  sessionStorage.setItem(KEYS.verifier, verifier);
  sessionStorage.setItem(KEYS.state, state);
  const params = new URLSearchParams({
    client_id: OIDC.clientId,
    redirect_uri: OIDC.redirectUri(),
    response_type: "code",
    scope: OIDC.scope,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
  });
  if (prompt) params.set("prompt", prompt);
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- external IdP navigation, not an internal route
  window.location.assign(`${OIDC.authorizeEndpoint}?${params.toString()}`);
}

/** Interactive sign-in (explicit click). */
export function signInInteractive() {
  sessionStorage.removeItem(KEYS.autoAttempted);
  void authorize(null);
}

/** Silent SSO attempt - only if the IdP session exists. Returns false when it bailed to the button. */
export function trySilentSignIn(): boolean {
  if (sessionStorage.getItem(KEYS.autoAttempted) === "1") return false;
  sessionStorage.setItem(KEYS.autoAttempted, "1");
  void authorize("none");
  return true;
}
