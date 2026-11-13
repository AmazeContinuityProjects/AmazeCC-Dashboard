---
title: "Follow a request from click to screen"
description: "Trace the admin overview request through React, apiFetch, HTTP, the API response, and the next render."
---

> **In one line:** a component asks for JSON, the API checks and loads it, then React uses the response to render the screen.

This walkthrough follows the admin overview's statistics. It teaches a useful
debugging habit: follow the data from the screen back to the code that requests
it, then forward to the code that displays it.

## 1. The route chooses the application

`src/app/page.tsx` renders the `Main` component. The root page is therefore a
small entry file; most interface logic is in `src/components/custom/Main.tsx`
and its child components. The Next.js App Router maps files under `src/app/`
to browser URLs.

## 2. The component requests metrics

After the admin is authenticated, `Main.tsx` calls SWR with the key
`/api/admin/stats` and a `fetcher`. SWR is a library that manages remote data:
it performs the request, keeps the last response, and can request fresh data
again when the window regains focus. Here the stats request refreshes every
30 seconds.

The dashboard landing component also loads stats for its cards and refreshes
on an interval. If you change this behavior, check both `Main.tsx` and
`AdminLandingPage.tsx`; they have separate loading paths.

## 3. `apiFetch` builds the HTTP request

`src/lib/api.ts` combines the configured API base with the path. If the browser
has `admin_token` in local storage, it adds an
`Authorization: Bearer <token>` header unless the caller supplied one already.
Then it calls the browser's built-in `fetch()` function.

An authorization header is a request header the API can use to identify the
admin. The token is not a password; it is still sensitive and must be treated
like a credential.

## 4. The separate API answers with JSON

The browser sends the request to `NEXT_PUBLIC_API_BASE`. The backend API
validates the token and permission, reads the needed data, and returns a
response. For the exact endpoint contract and backend implementation, use the
[AmazeCC-API handbook](https://docs.amazecc.com/amazecc-api/).

The frontend and API are separate deployments. If the frontend is healthy but
the request fails, inspect both the browser Network panel and the API service
logs; changing a React component cannot repair a server-side database failure.

## 5. The component interprets the response

The `fetcher` in `src/lib/api.ts` rejects non-2xx responses and attaches the
status and parsed response body to the error. A screen may also check a
`success` field in a 2xx response, because application-level failure can be
represented inside otherwise valid HTTP JSON.

Components keep display state such as `loading`, `error`, and the returned
data. React renders a loading message, an error state with retry, or the
successful metrics according to those values.

## Debug this path

1. Reproduce the screen behavior.
2. Open DevTools → **Network** and find `/api/admin/stats`.
3. Check the Request URL first. A wrong URL usually means configuration.
4. Check the status and response body. 401/403 points to credentials or
   permission; a network error can point to CORS, TLS, or an unavailable API.
5. Search for the path in `src/` to find its caller.
6. Read the component's loading/error branches before changing the API call.

Do not copy request headers from DevTools into a ticket without removing the
Authorization value.

## Next steps

- [API client and data loading](../02-frontend-architecture/api-client-and-data-loading.md)
- [Roles and permissions](../01-admin-portal/roles-and-permissions.md)
- [API reference and backend docs](https://docs.amazecc.com/amazecc-api/)
