---
title: "API client, line by line"
description: "Trace API_BASE, URL joining, browser guards, Headers, bearer-token attachment, fetch options, and SWR error handling in src/lib/api.ts."
---

> **Source:** `src/lib/api.ts`.

This file centralizes the API host and most request behavior. Understanding it helps you read every workspace that calls `apiFetch` or uses `fetcher` with SWR.

## 1. Select the API host

```ts
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "https://api.amazecc.com";
```

`const` creates a binding that cannot be reassigned. `export` makes it importable by other files. `process.env.NAME` reads a build-time environment variable. The `||` operator chooses the first truthy value: prefer `NEXT_PUBLIC_API_BASE`, then the older `NEXT_PUBLIC_API_URL`, otherwise use the production host.

Because both variables start with `NEXT_PUBLIC_`, Next.js includes their values in browser code. They are public configuration. Never put a password, secret key, or private service credential in them.

## 2. Join a URL and a path

```ts
export function apiUrl(path: string) {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}
```

`path: string` annotates the parameter. The function returns a template string. The ternary checks whether the path already begins with `/`; if it does, use it unchanged, otherwise prefix `/`. This handles both `apiUrl("/api/admin/stats")` and `apiUrl("api/admin/stats")`.

The API base is expected not to end with a slash. If it does, concatenating a slash-prefixed path can produce a double slash. Keep environment values normalized and inspect the final request URL in DevTools when debugging.

## 3. Read a browser-only token safely

```ts
export function getAdminToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}
```

The `typeof` check is safe even when `window` does not exist. During server rendering or a build step, the function returns `null` before it touches `localStorage`. In a browser, `getItem` returns stored text or `null`.

## 4. Build and send a request

```ts
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
```

`RequestInit` is the browser type for fetch options, including method, headers, and body. `= {}` makes the second argument optional. `new Headers(init.headers)` normalizes several valid header input forms into the browser's `Headers` object.

If a token exists and the caller has not already supplied an Authorization header, the helper adds `Bearer <token>`. An explicitly supplied authorization value is preserved. The `!` operator means “not”; `&&` means both conditions must be true.

The object passed to `fetch` uses spread syntax to copy caller options, then supplies the normalized headers. Since `headers` appears after `...init`, it replaces any earlier `headers` property with the normalized object. `fetch` returns a Promise for a `Response`; this helper returns that Promise to its caller rather than parsing the body.

## 5. SWR fetcher and failures

```ts
export const fetcher = async (path: string) => {
  const res = await apiFetch(path);

  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.') as any;
    error.info = await res.json().catch(() => ({}));
    error.status = res.status;
    throw error;
  }

  return res.json();
};
```

An `async` arrow function always returns a Promise. `await` waits for the response. `Response.ok` is true for successful HTTP status codes. On failure, the code creates an `Error`, parses a JSON body if possible, attaches response details, and throws. `.catch(() => ({}))` provides an empty object if the error body is missing or invalid JSON.

`as any` is a TypeScript assertion that bypasses checking for the custom `info` and `status` fields. It changes no runtime value. SWR catches the thrown error and exposes it as its `error` result. On success, `res.json()` returns a Promise for parsed data.

## Important boundary

This helper adds a bearer token, but it does not make the token secure from browser scripts; local storage is readable by JavaScript running on the same origin. It also does not validate response data. Components and the backend still need to handle application-level fields such as `{ "success": false }` and verify permissions server-side.

## Related source tours

- [Main login and shell](/06-code-tour/main-login-and-shell)
- [API client and data loading](/02-frontend-architecture/api-client-and-data-loading)
- [Browser storage and session values](/02-frontend-architecture/browser-storage)
