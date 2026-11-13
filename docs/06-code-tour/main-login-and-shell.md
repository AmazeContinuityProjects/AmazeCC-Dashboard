---
title: "Main login and application shell"
description: "Walk through Main.tsx from its client directive and imports to authentication, state, requests, and workspace rendering."
---

> **Source:** `src/components/custom/Main.tsx`.

This is the composition root of the admin interface. The root route and `/admin` both render this component. It restores a browser session, displays login when there is no saved token, then passes navigation state and the selected workspace into the shared layout.

## 1. Client execution and imports

The first line is `'use client'`. This tells Next.js that the file needs browser behavior such as state, effects, local storage, click handlers, and form events. Without it, Next.js would treat the component as a server component and those browser-only features would be unavailable.

The imports bring in four kinds of dependencies:

| Import | Why this file needs it |
|---|---|
| `useState`, `useEffect` from React | Store values between renders and run browser work after rendering |
| `apiFetch`, `fetcher` from `@/lib/api` | Send API requests and provide an SWR compatible fetch function |
| `dynamic` from `next/dynamic` | Load workspace modules on demand and disable their server rendering |
| `useSWR` from `swr` | Fetch dashboard statistics and refresh them periodically |
| `Input`, `Button` from `AdminUI` | Reuse the design system in the login form |

`@/` is the configured alias for the `src/` directory. For example, `@/lib/api` resolves to `src/lib/api.ts`.

## 2. Dynamic workspace imports

Each `dynamic(() => import("..."), { ssr: false })` creates a component whose module can be downloaded when the browser needs it. The import function is a promise-producing function: the browser can fetch and evaluate that module later. `ssr: false` means Next.js does not render that component on the server.

This pattern is repeated for the layout and the workspaces. It keeps the top-level module from eagerly importing every large screen and avoids executing browser-oriented screens during static rendering. The imported default export is assigned a local PascalCase name, so it can be used as a JSX component later.

## 3. State declarations

Each `useState(initialValue)` call returns a pair: the current value and a setter. The array destructuring syntax assigns those values to names:

| State | Meaning |
|---|---|
| `isAuthenticated` | Whether this component currently considers the user signed in |
| `isCheckingAuth` | Whether saved browser session data is still being read |
| `isLoading` | Whether the login request is in progress |
| `username`, `password` | Current login form field values |
| `error` | Message shown when authentication fails |
| `activeTab`, `activeSubTab` | Selected workspace and nested workspace tab |
| `userRole` | Current role, restricted by the declared union type to `superadmin` or `admin` |
| `userPermissions` | Permission strings used to filter navigation |

For example, `useState<string[]>([])` gives the permissions state an explicit array-of-strings type. The role initializer `useState<'superadmin' | 'admin'>('admin')` uses a union type: only the listed string values are accepted by TypeScript.

## 4. Restoring local session data

The mount effect calls `localStorage.getItem` for `admin_token`, `admin_role`, and `admin_permissions`. The empty dependency array `[]` means React runs this effect after the first browser render, rather than after every render.

When a token exists, the component marks itself authenticated. A saved role is restored only when present. Permissions are stored as JSON text, so `JSON.parse` converts that text back into a JavaScript array. Parsing is wrapped in `try/catch`: damaged or old storage will log an error rather than crash the whole app. Finally, `setIsCheckingAuth(false)` lets rendering proceed whether or not a token existed.

The role expression uses `as 'superadmin' | 'admin' | null`. This is a type assertion: it tells TypeScript what the developer expects from storage. It does not validate the value at runtime, so browser storage must not be treated as the security authority. The API must enforce permissions on every protected request.

## 5. Statistics request and derived values

`useSWR(isAuthenticated ? '/api/admin/stats' : null, fetcher, options)` asks SWR to fetch the stats endpoint only while authenticated. A `null` key disables the request. `refreshInterval: 30000` asks SWR to refresh every 30 seconds; `revalidateOnFocus: true` asks it to refresh when the browser tab becomes active again.

The next expression checks both `statsData?.success` and `statsData?.data`. Optional chaining (`?.`) safely reads a property if the value exists. If both checks pass, the component constructs a smaller `stats` object for the layout. Otherwise it supplies zero values. The queue count is calculated from paper totals after subtracting approved, pending review, and failed OCR counts, then adding pending papers.

`statsError` is destructured from the SWR result but is not used in this file's current render. A future change should either present it or remove the unused binding if lint rules require that.

## 6. Login handler

`handleLogin` is an asynchronous form event handler. Its type, `React.FormEvent`, describes the event sent by the form. `preventDefault()` prevents the browser's normal full-page form submission. The handler then sets the loading flag and clears the previous message.

Inside `try`, `apiFetch` sends a `POST` to `/api/admin/auth`. `Content-Type` says the request body is JSON, and `JSON.stringify({ username, password })` converts the JavaScript object to JSON text. `await` pauses this handler until the request finishes; it does not freeze the browser UI.

After `res.json()`, the code checks the API's application-level `success` and `token` fields. On success it writes token, role, and permissions to local storage, then updates React state so the authenticated interface renders. If the server returns a regular HTTP response with `success: false`, it displays the server's `error` or a fallback. A thrown network or parsing error reaches `catch` and becomes a connection message. `finally` always clears the loading state.

The form's `value` and `onChange` props make the inputs controlled: React state is the source of their displayed values. The inline `(e: any)` event annotations disable useful type checking for those two handlers; prefer the input event type supplied by React when editing this code.

## 7. Logout and screen selection

`handleLogout` removes the three storage keys and changes authentication state to false. It also resets the main tab to `dashboard`, so a later sign-in starts from the overview. It does not itself call a server logout endpoint; the API controls whether tokens expire or can be revoked.

Rendering uses early returns. While session restoration is running, the component returns a centered spinner. If no session is active, it returns the sign-in form. Only after those checks does it render `AdminLayout`.

The layout receives state values and setter functions as props. The children are selected by expressions such as `activeTab === 'papers' && <PapersManager />`. The `&&` pattern renders the component only when the condition is true. Several GoRobo tab IDs share one `<GoRoboAdmin>`; a nested conditional maps the selected ID to its `initialTab` prop.

This is composition: `Main` decides which screen is active, while `AdminLayout` owns the navigation frame and each workspace owns its own data and interaction logic.

## Follow the next dependency

- [Admin layout walkthrough](/06-code-tour/admin-layout-line-by-line)
- [API client walkthrough](/06-code-tour/api-client-line-by-line)
- [Login and session guide](/01-admin-portal/login-and-session)
