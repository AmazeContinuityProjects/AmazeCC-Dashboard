---
title: "Admin login and session"
description: "See how the login form calls the API, where the admin token is stored, how requests reuse it, and what logout clears."
---

import AdminTokenWarning from "/snippets/admin-token-warning.mdx";

> **In one line:** the browser sends the credentials to the API once, stores the returned bearer token in local storage, and attaches that token to later API requests.

## The login sequence

The form and its handlers live in `src/components/custom/Main.tsx`:

1. An administrator enters a username and password.
2. The submit handler calls `apiFetch('/api/admin/auth', ...)` with a JSON body.
3. The API validates the credentials and returns a token, role, and
   permission list when access is granted.
4. The browser saves `admin_token`, `admin_role`, and
   `admin_permissions` in local storage, then shows the admin shell.

The frontend does not decide whether a password is valid. The backend owns
that decision. See the [API admin-auth reference](https://docs.amazecc.com/amazecc-api/03-api-reference/auth-system/admin-auth)
for request and response details.

## What “bearer token” means

A bearer token is a credential: whoever possesses it can present it to the
server as proof of access until the backend rejects or expires it. `apiFetch`
adds it to the HTTP `Authorization` header as `Bearer <token>`. Never paste
that header into docs, screenshots, or a public issue.

<AdminTokenWarning />

## Page refresh and logout

When `Main` first loads, an effect reads the stored token, role, and permission
list. While that check runs, it shows a loading screen. If a token exists, the
UI opens the admin shell; the backend remains responsible for checking whether
that token is still valid on each protected request.

Logout removes the three admin keys and resets the selected tab. It does not
change the backend's credentials or revoke a token by itself. If backend token
revocation changes, document that from the API implementation.

## Browser storage tradeoffs

Local storage survives a reload and is readable by JavaScript running on the
same site. That makes it convenient for restoring the portal, but it also
means a cross-site scripting flaw could expose the token. Keep UI content
escaped, avoid injecting untrusted HTML, and follow the project's security
guidance. Do not move private server keys into frontend configuration.

## Troubleshooting

| What you see | What it usually means |
|---|---|
| Login network error | API host unreachable, TLS/CORS issue, or a blocked request |
| Login returns an error body | Credentials or account policy were rejected by the API |
| The portal opens but protected calls return 401 | Stored token is stale or invalid; sign out and sign in again |
| A particular menu group is missing | Role/permission filtering hid it; ask an API administrator to check the account's permission assignment |

## Where to next

- [Roles and permissions](./roles-and-permissions.md)
- [API client and data loading](../02-frontend-architecture/api-client-and-data-loading.md)
- [API admin authentication reference](https://docs.amazecc.com/amazecc-api/01-authentication/admin-auth)
