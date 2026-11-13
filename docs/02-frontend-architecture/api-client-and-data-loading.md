---
title: "API client and data loading"
description: "Trace API_BASE, apiUrl, apiFetch, bearer-token attachment, SWR, JSON parsing, and frontend error handling."
---

> **In one line:** `src/lib/api.ts` turns a relative API path into a full URL, attaches the saved admin token, sends the HTTP request, and parses JSON for the component.

## Choose the API host

`API_BASE` uses the first configured value in this order:

1. `NEXT_PUBLIC_API_BASE`
2. `NEXT_PUBLIC_API_URL`
3. `https://api.amazecc.com`

`NEXT_PUBLIC_` values are public browser configuration: they are compiled into
the client bundle. They are appropriate for a service URL, never for a private
key, password, or database URL.

## Build and send the request

`apiUrl(path)` joins the base and path. `apiFetch(path, init)` starts with any
headers supplied by the caller, reads `admin_token` from local storage, and
adds `Authorization: Bearer <token>` if a token exists and the caller has not
already set that header. It then delegates to the browser's `fetch()`.

Example:

```ts
const response = await apiFetch("/api/admin/stats");
const data = await response.json();
```

For a JSON write, a component usually sets `Content-Type: application/json`
and passes `JSON.stringify(payload)` as the body. `JSON.stringify` converts a
JavaScript object into the text format HTTP sends.

## `fetcher` and SWR

The exported `fetcher` checks `response.ok`. If the HTTP status is not a
success status, it parses any JSON error body, puts the body and status on an
Error object, and throws it. SWR catches that thrown error and exposes it to
the component along with any prior data.

Some screens call `apiFetch` directly instead of using `fetcher`. Read the
screen's exact path: a direct caller may have custom handling for a `success`
field, a file response, or a multi-step operation.

## Two kinds of failure

- **HTTP failure:** the status is outside the success range, such as 401 or
  500. `fetcher` throws for this case.
- **Application failure:** the API can return HTTP 200 with JSON such as
  `{ "success": false, "error": "..." }`. A component must inspect the
  response body when the backend uses this convention.

The backend handbook documents the exact response contract for each route.
Do not infer a response shape from the screen's TypeScript interface alone.

## CORS and HTTPS

When the frontend and API are on different origins (different host, scheme,
or port), the browser enforces Cross-Origin Resource Sharing (CORS). If the
request works in a command-line tool but fails in the browser, inspect the
browser console for CORS and certificate errors. The API must allow the
dashboard origin and the headers it sends.

## Where to next

- [Follow a request from click to screen](../00-start-here/request-to-screen.md)
- [Login and session](../01-admin-portal/login-and-session.md)
- [AmazeCC-API handbook](https://docs.amazecc.com/amazecc-api/)
